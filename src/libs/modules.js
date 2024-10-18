import Data from "./data";
import { Common } from './common.js';


class Modules {
  constructor() {
   this.data = new Data();
   this.modules = {};
   let res = this.data.adminModulesList(null);
   Common.addLog('Loading modules:');
   if (res) {
    for (let i = 0; i < res.length; i++) {
     let mod = res[i];
     console.log('Loading module: ' + res[i]);
     //this.add(res[i]);
    }
   }
   Common.addLog('Modules loaded.');
  }

  add(name) {

    if (this.modules[name]) return;
    const module = require('./modules/' + name);
    this.modules[name] = new module(this.data);
  }

  get(name) {
    return this.modules[name];
  }
}

export default Modules;
