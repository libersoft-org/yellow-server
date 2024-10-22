import Data from './data';
import { Log } from 'yellow-server-common';
import Module from './module';


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
    await this.add(new Module(mod.name, mod.connection_string));
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

 async send(name, msg, wsGuid, requestID) {
  Log.debug('Sending message:', msg, 'to module:', name);
  let m = this.modules[name];
  if (!m) {
   Log.error('Module not found:', name);
   return;
  }
  await m.send(msg, wsGuid, requestID);
  Log.info('Message sent.');
 }

}

export default Modules;
