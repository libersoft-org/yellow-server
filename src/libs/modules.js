import Data from './data';
import { Log } from 'yellow-server-common';

class Module {
 constructor(name, connection_string) {
  this.name = name;
  this.connection_string = connection_string;
 }
 async connect() {
  Log.info('Connecting to the module: ' + this.connection_string);
  this.ws = new WebSocket(this.connection_string);
  this.ws.onopen = () => {
   Log.info('Connected to the module: ' + this.connection_string);
  };
  this.ws.onmessage = (event) => {
   Log.info('Message from the module: ' + event.data);
  };
  this.ws.onerror = (event) => {
   Log.info('Error from the module: ' + event);
  };
  this.ws.onclose = () => {
   Log.info('Disconnected from the module: ' + this.connection_string);
  };
  await this.ws.send('Hello from the server!');
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
}

export default Modules;
