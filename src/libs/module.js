import { Log } from "yellow-server-common";

class Module {
 constructor(data, name, connection_string) {
  this.data = data;
  this.name = name;
  this.connection_string = connection_string;
  this.requests = {};
 }
 async connect() {
  Log.info('Connecting to the module: ' + this.connection_string);
  this.ws = new WebSocket(this.connection_string);
  this.ws.onopen = async () => {
   Log.info('Connected to the module: ' + this.connection_string);
   //await this.ws.send('Hello from the server!');
  };
  this.ws.onmessage = async (event) => {

   let msg = null;
   try {
    msg = JSON.parse(event.data);
   }
   catch (e) {
    Log.error('Error parsing JSON:', event.data);
    return;
   }

   Log.info('Message from module', this.name, msg);

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
     Log.warning('No callback for the request:', msg);
     return;
    }

    cb(msg);
    delete this.requests[wsGuid]?.[requestID];

   }
   else if (msg.type === 'notify') {

    Log.info('Notify from module', this.name, msg);

    /* todo */



   }
   else if (msg.type === 'command') {

    Log.info('Command from module', this.name, msg);

    await this.processCommandFromModule(msg);
   }


   else {
    Log.warning('Unknown message type from module', this.name, msg);
   }
  };
  this.ws.onerror = event => {
   Log.error('Error from module', this.name, event);
  };
  this.ws.onclose = () => {
   Log.info('Disconnected from the module: ' + this.connection_string);
  };
 }

 async processCommandFromModule(msg) {
  const cmd = msg.command;
  const cmds = {
   'getDomainIDByName': this.data.getDomainIDByName,
   'getUserIDByUsernameAndDomainID': this.data.getUserIDByUsernameAndDomainID,
   'userGetUserInfo': this.data.userGetUserInfo,
   'getDomainNameByID': this.data.getDomainNameByID,
   


  }
 }


 async send(msg, wsGuid, requestID)
 {

  if (this.requests[wsGuid]?.[requestID]) {
   console.log('Request already exists:', wsGuid, requestID);
   return;
  }

  const ws_requests = this.requests[wsGuid];
  if (!ws_requests) {
   this.requests[wsGuid] = {};
  }

  let promise = new Promise((resolve, reject) => {
   this.requests[wsGuid][requestID] = (res) => { resolve(res); }
   this.ws.send(JSON.stringify(msg));
  });

  await promise;
 }
}

export default Module;
