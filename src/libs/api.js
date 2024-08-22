import os from 'os';
import Data from './data.js';
//import DNS from './dns.js';
import { Common } from './common.js';

class API {
 constructor() {
  this.data = new Data();
  //this.dns = new DNS();
  this.apiMethods = {
   admin_login: { method: this.adminLogin, reqAdminSession: false, reqUserSession: false },
   admin_logout: { method: this.adminLogout, reqAdminSession: true, reqUserSession: false },
   admin_sysinfo: { method: this.adminSysInfo, reqAdminSession: true, reqUserSession: false },
   user_login: { method: this.userLogin, reqAdminSession: false, reqUserSession: false },
   user_logout: { method: this.userLogout, reqAdminSession: false, reqUserSession: true }
  };
 }

 async processAPI(req) {
  if (!Common.isValidJSON(req)) return { error: 902, message: 'Invalid JSON command' };
  const objReq = JSON.parse(req);
  if (!objReq.command) return { error: 999, message: 'Command not set' };
  const apiMethod = this.apiMethods[objReq.command];
  if (!apiMethod) return { error: 903, message: 'Unknown command' };
  if (apiMethod.reqAdminSession) {
   if (!objReq.session) return { error: 995, message: 'Admin session is missing' };
   if (await this.data.adminCheckSession(objReq.session)) return { error: 997, message: 'Admin session is not valid' };
  }
  if (apiMethod.reqUserSession && objReq.session) {
   if (!objReq.session) return { error: 996, message: 'User session is missing' };
   if (await this.data.userCheckSession(objReq.session)) return { error: 998, message: 'User session is not valid' };
  }
  return await apiMethod.method.call(this, objReq.data);
 }

 async adminLogin(p = null) {
  return await this.data.adminLogin(p.username, p.password);
 }

 adminLogout(p = null) {
  console.log('admin logout');
  return {};
 }

 userLogin(p = null) {
  console.log('user login');
  return {};
 }

 userLogout(p = null) {
  console.log('user logout');
  return {};
 }

 adminSysInfo() {
  let networks = [];
  let net = os.networkInterfaces();
  for (let iface in net) {
   let ifc = {};
   if (iface != 'lo') {
    let addresses = [];
    for (let i = 0; i < net[iface].length; i++) addresses.push(net[iface][i].address);
    ifc[iface] = addresses;
    networks.push(ifc);
   }
  }
  function getUptime(seconds) {
   const days = Math.floor(seconds / 86400);
   const hours = Math.floor((seconds % 86400) / 3600);
   const minutes = Math.floor((seconds % 3600) / 60);
   const secs = Math.floor(seconds % 60);
   return days + ' days, ' + hours + ' hours, ' + minutes + ' minutes, ' + secs + ' seconds';
  }
  return {
   app_name: Common.appName,
   app_version: Common.appVersion,
   os: {
    name: os.type(),
    version: os.release()
   },
   cpu: {
    cpus: os.cpus(),
    arch: os.arch(),
    load: Math.min(Math.floor((os.loadavg()[0] * 100) / os.cpus().length), 100)
   },
   ram: {
    total: os.totalmem(),
    free: os.freemem()
   },
   hostname: os.hostname(),
   // networks: JSON.stringify(networks),
   networks: networks,
   uptime: getUptime(os.uptime())
  };
 }
}

export default API;
