import os from 'os';
import Data from './data.js';
import { Common } from './common.js';
//import DNS from './dns.js';

class API {
 constructor() {
  this.data = new Data();
  //this.dns = new DNS();
  this.apiMethods = {
   admin_login: { method: this.adminLogin, reqAdminSession: false, reqUserSession: false },
   admin_logout: { method: this.adminLogout, reqAdminSession: true, reqUserSession: false },
   user_login: { method: this.userLogin, reqAdminSession: false, reqUserSession: false },
   user_logout: { method: this.userLogout, reqAdminSession: false, reqUserSession: true }
  };
 }

 async processAPI(req) {
  console.log(req);
  if (!Common.isValidJSON(req)) return { error: 902, message: 'Invalid JSON command' };
  const objReq = JSON.parse(req);
  if (!objReq.command) return { error: 999, message: 'Command not set' };
  const apiMethod = this.apiMethods[objReq.command];
  if (!apiMethod) return { error: 903, message: 'Unknown command' };
  if (apiMethod.reqAdminSession && !(await this.data.checkAdminSession(session))) return { error: 997, message: 'Admin session expired' };
  if (apiMethod.reqUserSession && !(await this.data.checkAdminSession(session))) return { error: 998, message: 'User session expired' };
  return await apiMethod.method.call(req.data);
 }

 adminLogin(p = null) {
  console.log('admin login');
 }

 adminLogout(p = null) {
  console.log('admin logout');
 }

 userLogin(p = null) {
  console.log('user login');
 }

 userLogout(p = null) {
  console.log('user logout');
 }

 adminGetSysInfo() {
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
  let secs = Math.floor(os.uptime());
  let mins = Math.floor(secs / 60);
  let hours = Math.floor(mins / 60);
  let days = Math.floor(hours / 24);
  days = days % 24;
  hours = hours % 60;
  mins = mins % 60;
  secs = secs % 60;
  let updateTime = function (original_time) {
   const originalFormat = '20 days, 40 hours, 57 min';
   // Convert original format into a date object
   const date = new Date();
   date.setDate(parseInt(originalFormat.split(' ')[0]) + 1); // Add 1 day
   date.setHours(parseInt(originalFormat.split(', ')[1]) - 24); // Subtract 24 hours
   date.setMinutes(parseInt(originalFormat.split(', ')[2])); // Keep minutes the same
   // Format resulting date object into desired output format: "21 days, 16 hours, 57 min"
   const outputFormat = `${date.getDate()} days, ${date.getHours()} hours, ${date.getMinutes()} minutes, ` + secs + ' seconds';
   return outputFormat;
  };
  let uptime = updateTime(days + ' days, ' + hours + ' hours, ' + mins + ' minutes, ' + secs + ' seconds');
  let total_memory = os.totalmem(),
   free_memory = os.freemem();
  let total_mem_in_kb = total_memory / 1024,
   free_mem_in_kb = free_memory / 1024;
  let total_mem_in_mb = total_mem_in_kb / 1024,
   free_mem_in_mb = free_mem_in_kb / 1024;
  let total_mem_in_gb = total_mem_in_mb / 1024,
   free_mem_in_gb = free_mem_in_mb / 1024;
  return {
   app_name: Common.appName,
   app_version: Common.appVersion,
   os_name: os.type(),
   os_version: os.release(),
   cpu_model: os.cpus()[0].model,
   cpu_cores: os.cpus().length,
   cpu_arch: os.arch(),
   cpu_load: Math.min(Math.floor((os.loadavg()[0] * 100) / os.cpus().length), 100),
   ram_total: total_mem_in_gb,
   ram_free: free_mem_in_gb,
   hostname: os.hostname(),
   // networks: JSON.stringify(networks),
   networks: networks,
   uptime: uptime
  };
 }
}

export default API;
