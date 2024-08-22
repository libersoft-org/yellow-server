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
   if (!(await this.data.adminCheckSession(objReq.session))) return { error: 997, message: 'Admin session is not valid' };
  }
  if (apiMethod.reqUserSession && objReq.session) {
   if (!objReq.session) return { error: 996, message: 'User session is missing' };
   if (!(await this.data.userCheckSession(objReq.session))) return { error: 998, message: 'User session is not valid' };
  }
  return await apiMethod.method.call(this, objReq.data);
 }

 async adminLogin(p = null) {
  if (!p.username) return { error: 1, message: 'Username is missing' };
  username = username.toLowerCase();
  const res = this.data.getAdminCredentials(username);
  if (!res) return { error: 2, message: 'Wrong username' };
  if (!(await this.data.verifyHash(res.password, p.password))) return { error: 3, message: 'Wrong password' };
  const session = this.getSessionID();
  await this.data.adminSetLogin(res.id, session);
  return { error: 0, data: { session } };
 }

 async adminLogout(p = null) {
  return await this.data.adminLogout(p.session);
 }

 async adminAddAdmin(p = null) {
  username = username.toLowerCase();
  if (username.length < 3 || username.length > 16 || !/^(?!.*[_.-]{2})[a-z0-9]+([_.-]?[a-z0-9]+)*$/.test(username)) return { error: 1, message: 'Invalid username. Username must be 3-16 characters long, can contain only English alphabet letters, numbers, and special characters (_ . -), but not at the beginning, end, or two in a row' };
  if (password.length < 8) return { error: 2, message: 'Password has to be 8 or more characters long' };
  await this.data.adminAddAdmin(username, await this.getHash(password));
  return { error: 0, data: { message: 'Admin was created successfully' } };
 }

 async userLogin(p = null) {
  let [username, domain] = p.address.split('@');
  if (!username || !domain) return { error: 1, message: 'Invalid username format' };
  username = username.toLowerCase();
  domain = domain.toLowerCase();
  const domainID = await this.data.getDomainID(domain);
  if (!domainID) return { error: 2, message: 'Domain name not found on this server' };
  const userCredentials = this.data.getUserCredentials(username, domainID);
  if (!userCredentials) return { error: 3, message: 'Wrong user address' };
  if (!(await this.verifyHash(userCredentials.password, p.password))) return { error: 4, message: 'Wrong password' };
  const session = this.getSessionID();
  this.data.userSetLogin(userID, session);
  return { error: 0, data: { session } };
 }

 async userLogout(p = null) {
  return await this.data.userLogout(p.session);
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

 getSessionID(len) {
  return Crypto.randomBytes(16).toString('hex') + Date.now().toString(16);
 }

 async getHash(password, memoryCost = 65536, hashLength = 64, timeCost = 20, parallelism = 1) {
  // default: 64 MB RAM, 64 characters length, 20 difficulty to calculate, 1 thread needed
  return await Argon2.hash(password, { memoryCost, hashLength, timeCost, parallelism });
 }

 async verifyHash(hash, password) {
  return await Argon2.verify(hash, password);
 }
}

export default API;
