import Data from './data';
import { newLogger } from 'yellow-server-common';
import Module from './module';
let Log = newLogger('modules');

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
    if (this.modules[mod.name]) {
     Log.error('Module already loaded:', mod.name);
    } else {
     await this.add(new Module(this.app, this.data, mod.id, mod.name, mod.connection_string));
    }
   }
  }
  Log.info('Modules loaded.');
 }

 async init_module(name) {
  let res = await this.data.adminModulesList();
  if (res) {
   for (let i = 0; i < res.length; i++) {
    let mod = res[i];
    if (mod.name === name) {
     if (this.modules[mod.name]) {
      Log.error('Module already loaded:', mod.name);
     } else {
      if (mod.enabled) {
       await this.add(new Module(this.app, this.data, mod.id, mod.name, mod.connection_string));
      }
     }
     break;
    }
   }
  }
 }

 async deinit() {
  for (let name in this.modules) {
   await this.remove(this.modules[name].id);
  }
 }

 /*async reinit() {
  await this.deinit();
  await this.init();
 }*/

 async reinit_module(id, new_name, enabled) {
  await this.remove(id);
  if (enabled) await this.init_module(new_name);
 }

 async add(m) {
  this.modules[m.name] = m;
  await m.connect();
 }

 get(name) {
  return this.modules[name];
 }

 moduleById(id) {
  for (let name in this.modules) {
   let m = this.modules[name];
   //Log.debug('moduleById:', name, id, m);
   if (m.id == id) return m;
  }
  return null;
 }

 async remove(id) {
  let m = this.moduleById(id);
  //Log.debug('Removing module:', id, m);
  if (m) {
   await m.disconnect();
   delete this.modules[m.name];
  }
 }

 async sendUserCmdToModule(corr, module_name, msg, wsGuid, requestID) {
  Log.debug(corr, 'to module:', module_name, 'sending message:', msg);
  let m = this.modules[module_name];
  if (!m) {
   Log.error(corr, 'Module not found:', module_name);
   return { error: 999, message: 'Module not found' };
  }
  let res = await m.sendRequest(corr, msg, wsGuid, requestID);
  return res;
 }

 async notifyModulesOfClientDisconnect(wsGuid) {
  for (let name in this.modules) {
   let m = this.modules[name];
   await m.handleClientDisconnect(wsGuid);
  }
 }
}

export default Modules;
