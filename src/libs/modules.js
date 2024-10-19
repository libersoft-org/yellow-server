import Data from './data';
import { Log } from 'yellow-server-common';

class Module {
 constructor(connection_string) {
  this.connection_string = connection_string;
  this.connect();
 }
 connect() {
  Log.info('Connecting to the module: ' + this.connection_string);
  this.ws = new WebSocket(this.connection_string);
 }
}

class Modules {
 constructor() {
  this.data = new Data();
  this.modules = {};
  let res = this.data.adminModulesList(null);
  Log.info('Loading modules:');
  if (res) {
   for (let i = 0; i < res.length; i++) {
    let mod = res[i];
    console.log('Loading module: ' + res[i]);
    this.add(res[i]);
   }
  }
  Log.info('Modules loaded.');
 }

 add(name) {
  if (this.modules[name]) return;

  this.modules[name] = new Module(this.data);
 }

 get(name) {
  return this.modules[name];
 }
}

export default Modules;
