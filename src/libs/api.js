import os from 'os';
import Crypto from 'crypto';
import Argon2 from 'argon2';
import Data from './data.js';
//import DNS from './dns.js';
import { Common } from './common.js';

class API {
 constructor() {
  this.data = new Data();
  //this.dns = new DNS();
  this.apiMethods = {
   admin_login: { method: this.adminLogin, reqAdminSession: false, reqUserSession: false },
   admin_list_sessions: { method: this.adminListSessions, reqAdminSession: true, reqUserSession: false },
   admin_del_session: { method: this.adminDelSession, reqAdminSession: true, reqUserSession: false },
   admin_add_admin: { method: this.adminAddAdmin, reqAdminSession: true, reqUserSession: false },
   admin_edit_admin: { method: this.adminEditAdmin, reqAdminSession: true, reqUserSession: false },
   admin_del_admin: { method: this.adminDelAdmin, reqAdminSession: true, reqUserSession: false },
   admin_add_domain: { method: this.adminAddDomain, reqAdminSession: true, reqUserSession: false },
   admin_edit_domain: { method: this.adminEditDomain, reqAdminSession: true, reqUserSession: false },
   admin_del_domain: { method: this.adminDelDomain, reqAdminSession: true, reqUserSession: false },
   admin_add_user: { method: this.adminAddUser, reqAdminSession: true, reqUserSession: false },
   admin_edit_user: { method: this.adminEditUser, reqAdminSession: true, reqUserSession: false },
   admin_del_user: { method: this.adminDelUser, reqAdminSession: true, reqUserSession: false },
   admin_sysinfo: { method: this.adminSysInfo, reqAdminSession: true, reqUserSession: false },
   user_login: { method: this.userLogin, reqAdminSession: false, reqUserSession: false },
   user_list_sessions: { method: this.userListSessions, reqAdminSession: false, reqUserSession: true },
   user_del_session: { method: this.userDelSession, reqAdminSession: false, reqUserSession: true }
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

 async adminLogin(p) {
  if (!p) return { error: 1, message: 'Parameters are missing' };
  if (!p.username) return { error: 2, message: 'Username is missing' };
  if (!p.password) return { error: 3, message: 'Password is missing' };
  p.username = p.username.toLowerCase();
  const userCredentials = await this.data.getAdminCredentials(p.username);
  if (!userCredentials) return { error: 4, message: 'Wrong username' };
  if (!(await this.verifyHash(userCredentials.password, p.password))) return { error: 5, message: 'Wrong password' };
  const session = this.getSessionID();
  await this.data.adminSetLogin(userCredentials.id, session);
  return { error: 0, data: { session } };
 }

 async adminListSessions() {
  const res = await this.data.adminListSessions();
  return { error: 950, message: 'Not yet implemented' };
 }

 async adminDelSession(p) {
  if (!p) return { error: 1, message: 'Parameters are missing' };
  if (!p.session) return { error: 2, message: 'Session to be deleted not set' };
  const res = await this.data.adminDelSession(p.session);
  if (!res) return { error: 3, message: 'Session to be deleted not found' };
  return { error: 0, message: 'Session was deleted' };
 }

 async adminAddAdmin(p) {
  if (!p) return { error: 1, message: 'Parameters are missing' };
  if (!p.username) return { error: 2, message: 'Username is missing' };
  if (!p.password) return { error: 3, message: 'Password is missing' };
  p.username = p.username.toLowerCase();
  if (p.username.length < 3 || p.username.length > 16 || !/^(?!.*[_.-]{2})[a-z0-9]+([_.-]?[a-z0-9]+)*$/.test(username)) return { error: 4, message: 'Invalid username. Username must be 3-16 characters long, can contain only English alphabet letters, numbers, and special characters (_ . -), but not at the beginning, end, or two in a row' };
  if (p.password.length < 8) return { error: 5, message: 'Password has to be 8 or more characters long' };
  await this.data.adminAddAdmin(p.username, await this.getHash(p.password));
  return { error: 0, data: { message: 'Admin was created successfully' } };
 }

 async adminEditAdmin(p) {
  return { error: 950, message: 'Not yet implemented' };
 }

 async adminDelAdmin(p) {
  return { error: 950, message: 'Not yet implemented' };
 }

 async adminAddDomain(p) {
  return { error: 950, message: 'Not yet implemented' };
 }

 async adminEditDomain(p) {
  return { error: 950, message: 'Not yet implemented' };
 }

 async adminDelDomain(p) {
  return { error: 950, message: 'Not yet implemented' };
 }

 async adminAddUser(p) {
  return { error: 950, message: 'Not yet implemented' };
 }

 async adminEditUser(p) {
  return { error: 950, message: 'Not yet implemented' };
 }

 async adminDelUser(p) {
  return { error: 950, message: 'Not yet implemented' };
 }

 async userLogin(p) {
  if (!p) return { error: 1, message: 'Parameters are missing' };
  if (!p.address) return { error: 2, message: 'Address is missing' };
  if (!p.password) return { error: 3, message: 'Password is missing' };
  let [username, domain] = p.address.split('@');
  if (!username || !domain) return { error: 4, message: 'Invalid username format' };
  username = username.toLowerCase();
  domain = domain.toLowerCase();
  const domainID = await this.data.getDomainID(domain);
  if (!domainID) return { error: 5, message: 'Domain name not found on this server' };
  const userCredentials = await this.data.getUserCredentials(username, domainID);
  if (!userCredentials) return { error: 6, message: 'Wrong user address' };
  if (!(await this.verifyHash(userCredentials.password, p.password))) return { error: 7, message: 'Wrong password' };
  const session = this.getSessionID();
  this.data.userSetLogin(userID, session);
  return { error: 0, data: { session } };
 }

 async userListSessions(p = null) {
  return { error: 950, message: 'Not yet implemented' };
 }

 async userDelSession(p) {
  if (!p) return { error: 1, message: 'Parameters are missing' };
  if (!p.session) return { error: 2, message: 'Session to be deleted not set' };
  const res = await this.data.userLogout(p.session);
  if (!res) return { error: 3, message: 'Session to be deleted not found' };
  return { error: 0, message: 'Session was deleted' };
 }

 adminSysInfo() {
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
    cpus: os.cpus().map(cpu => cpu.model),
    arch: os.arch(),
    load: Math.min(Math.floor((os.loadavg()[0] * 100) / os.cpus().length), 100)
   },
   ram: {
    total: os.totalmem(),
    free: os.freemem()
   },
   hostname: os.hostname(),
   networks: os.networkInterfaces(),
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
