import Data from './data';
import { Log } from 'yellow-server-common';

class Module {
 constructor(name, connection_string) {
  this.name = name;
  this.connection_string = connection_string;
  this.requests = {};
 }
 async connect() {
  Log.info('Connecting to the module: ' + this.connection_string);
  this.ws = new WebSocket(this.connection_string);
  this.ws.onopen = async () => {
   Log.info('Connected to the module: ' + this.connection_string);
   await this.ws.send('Hello from the server!');
  };
  this.ws.onmessage = event => {

   let msg = null;
   try {
    msg = JSON.parse(event.data);
   }
   catch (e) {
    Log.error('Error parsing JSON:', event.data);
    return;
   }

   Log.info('Message from the module: ' + msg);

   if (msg.type === 'response') {

    const wsGuid = msg.wsGuid;
    const requestID = msg.requestID;

    if (!requestID) {
     Log.warning('No request ID in the response:', msg);
     return;
    }
    if (!wsGuid) {
     Log.warning('No wsGuid in the response:', msg);
     return;
    }

    const cb = this.requests[wsGuid]?.[requestID];
    if (!cb) {
     Log.warning('No callback for the request:', req);
     return;
    }
    cb(req);
    delete this.requests[wsGuid]?.[requestID];

   }
   else if (msg.type === 'event') {
    Log.info('Event from the module:', msg);
   }
   else if (msg.type === 'notify') {
    Log.info('Notify from the module:', msg);
   }
   else {
    Log.warning('Unknown message type:', msg);
   }
  };
  this.ws.onerror = event => {
   Log.info('Error from the module: ' + event);
  };
  this.ws.onclose = () => {
   Log.info('Disconnected from the module: ' + this.connection_string);
  };
 }

 async send(msg, cb)
 {

  if (this.requests[wsGuid]?.[requestID]) {
   console.log('Request already exists:', wsGuid, requestID);
   return;
  }

  const ws_requests = this.requests[wsGuid];
  if (!ws_requests) {
   this.requests[wsGuid] = {};
  }

  this.requests[wsGuid][requestID] = cb;
  await this.ws.send(msg);
 }
}

class Modules {
 constructor() {
  this.data = new Data();
  this.modules = {};
 }

 async init() {
  let res = await this.data.adminModulesList(null);
  Log.info('Loading modules:');
  if (res) {
   for (let i = 0; i < res.length; i++) {
    let mod = res[i];
    Log.info('Loading module:', mod);
    await this.add(new Module(mod[1], mod[2]));
   }
  }
  Log.info('Modules loaded.');
 }

 async add(m) {
  this.modules[m.name] = m;
  await m.connect();
 }

 get(name) {
  return this.modules[name];
 }

 async send(name, msg, cb) {
  let m = this.modules[name];
  if (!m) {
   Log.error('Module not found:', name);
   return;
  }
  await m.send(msg, cb);
  Log.info('Message sent.');
 }

}

export default Modules;
