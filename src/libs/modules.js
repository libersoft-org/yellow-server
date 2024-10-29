import Data from './data';
import { Log } from 'yellow-server-common';
import Module from './module';

class Modules {
 constructor(app) {
  this.app = app;
  this.data = new Data();
  this.modules = {};
 }

 getAvailable() {
  let res = {};
  for (let name in this.modules) {
   res[name] = this.modules[name].connected;
  }
  return res;
 }

 async init() {
  let res = await this.data.adminModulesList(null);
  Log.info('Loading modules:');
  if (res) {
   for (let i = 0; i < res.length; i++) {
    let mod = res[i];
    Log.info('Loading module:', mod);
    await this.add(new Module(this.app, this.data, mod.name, mod.connection_string));
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
  Log.debug('to module:', name, 'sending message:', msg);
  let m = this.modules[name];
  if (!m) {
   Log.error('Module not found:', name);
   return { error: 999, message: 'Module not found' };
  }
  let res = await m.sendRequest(msg, wsGuid, requestID);

  return res;
 }

 async notifyModulesOfClientDisconnect(wsGuid) {
  for (let name in this.modules) {
   let m = this.modules[name];
   await m.notify({event: 'client_disconnect', data: wsGuid});
  }
 }
}

export default Modules;
