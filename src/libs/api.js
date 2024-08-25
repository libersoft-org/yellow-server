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
   admin_login: { method: this.adminLogin },
   admin_list_sessions: { method: this.adminListSessions, reqAdminSession: true },
   admin_del_session: { method: this.adminDelSession, reqAdminSession: true },
   admin_list_admins: { method: this.adminListAdmins, reqAdminSession: true },
   admin_add_admin: { method: this.adminAddAdmin, reqAdminSession: true },
   admin_edit_admin: { method: this.adminEditAdmin, reqAdminSession: true },
   admin_del_admin: { method: this.adminDelAdmin, reqAdminSession: true },
   admin_list_domains: { method: this.adminListDomains, reqAdminSession: true },
   admin_add_domain: { method: this.adminAddDomain, reqAdminSession: true },
   admin_edit_domain: { method: this.adminEditDomain, reqAdminSession: true },
   admin_del_domain: { method: this.adminDelDomain, reqAdminSession: true },
   admin_list_users: { method: this.adminListUsers, reqAdminSession: true },
   admin_add_user: { method: this.adminAddUser, reqAdminSession: true },
   admin_edit_user: { method: this.adminEditUser, reqAdminSession: true },
   admin_del_user: { method: this.adminDelUser, reqAdminSession: true },
   admin_sysinfo: { method: this.adminSysInfo, reqAdminSession: true },
   user_login: { method: this.userLogin },
   user_list_sessions: { method: this.userListSessions, reqUserSession: true },
   user_del_session: { method: this.userDelSession, reqUserSession: true }
  };
 }

 async processAPI(json) {
  if (!Common.isValidJSON(json)) return { error: 902, message: 'Invalid JSON command' };
  const req = JSON.parse(json);
  if (!req.command) return { error: 999, message: 'Command not set' };
  const apiMethod = this.apiMethods[req.command];
  if (!apiMethod) return { error: 903, message: 'Unknown command' };
  const context = {};
  if (apiMethod.reqAdminSession) {
   if (!req.sessionID) return { error: 995, message: 'Admin session is missing' };
   if (!(await this.data.adminCheckSession(req.sessionID))) return { error: 997, message: 'Admin session ID is not valid' };
   // TODO: check if session is not expired
   // TODO: update LAST time
   const adminID = await this.data.getAdminIDBySession(req.sessionID);
   if (adminID) context.adminID = adminID;
  } else if (apiMethod.reqUserSession) {
   if (!req.sessionID) return { error: 996, message: 'User session is missing' };
   if (!(await this.data.userCheckSession(req.sessionID))) return { error: 998, message: 'User session ID is not valid' };
   // TODO: check if session is not expired
   // TODO: update LAST time
   const userID = await this.data.getUserIDBySession(req.sessionID);
   if (userID) context.userID = userID;
  }
  if (req.sessionID) context.sessionID = req.sessionID;
  if (req.params) context.params = req.params;
  console.log('SENDING CONTEXT:', context);
  return await apiMethod.method.call(this, context);
 }

 async adminLogin(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.username) return { error: 2, message: 'Username is missing' };
  if (!c.params.password) return { error: 3, message: 'Password is missing' };
  c.params.username = c.params.username.toLowerCase();
  const adminCredentials = await this.data.getAdminCredentials(c.params.username);
  if (!adminCredentials) return { error: 4, message: 'Wrong username' };
  if (!(await this.verifyHash(adminCredentials.password, c.params.password))) return { error: 5, message: 'Wrong password' };
  const sessionID = this.getNewSessionID();
  await this.data.adminSetLogin(adminCredentials.id, sessionID);
  return { error: 0, data: { sessionID } };
 }

 async adminListSessions(c) {
  const res = await this.data.adminListSessions(c.adminID, c.params?.count, c.params?.offset);
  if (!res) return { error: 1, message: 'No sessions found for this user' };
  return { error: 0, data: { sessions: res } };
 }

 async adminDelSession(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.sessionID) return { error: 2, message: 'Session ID to be deleted not set' };
  if (!(await this.data.adminSessionExists(c.adminID, c.params.sessionID))) return { error: 3, message: 'Session ID to be deleted not found for this admin' };
  await this.data.adminDelSession(c.adminID, c.params.sessionID);
  return { error: 0, message: 'Session was deleted' };
 }

 async adminListAdmins(c) {
  const res = await this.data.adminListAdmins(c.params?.count, c.params?.offset);
  if (!res) return { error: 1, message: 'No admins found' };
  return { error: 0, data: { admins: res } };
 }

 async adminAddAdmin(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.username) return { error: 2, message: 'Username is missing' };
  if (!c.params.password) return { error: 3, message: 'Password is missing' };
  c.params.username = c.params.username.toLowerCase();
  if (await this.data.adminExistsByUsername(c.params.username)) return { error: 4, message: 'This admin already exists' };
  if (c.params.username.length < 3 || c.params.username.length > 16 || !/^(?!.*[_.-]{2})[a-z0-9]+([_.-]?[a-z0-9]+)*$/.test(c.params.username)) return { error: 5, message: 'Invalid username. Username must be 3-16 characters long, can contain only English alphabet letters, numbers, and special characters (_ . -), but not at the beginning, end, or two in a row' };
  if (c.params.password.length < 8) return { error: 6, message: 'Password has to be 8 or more characters long' };
  await this.data.adminAddAdmin(c.params.username, await this.getHash(c.params.password));
  return { error: 0, data: { message: 'Admin was created successfully' } };
 }

 async adminEditAdmin(c) {
  return { error: 950, message: 'Not yet implemented' };
 }

 async adminDelAdmin(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.adminID) return { error: 2, message: 'Admin ID is missing' };
  if (!(await this.data.adminExistsByID(c.params.adminID))) return { error: 3, message: 'Wrong admin ID' };
  await this.data.adminDelAdmin(c.params.adminID);
  return { error: 0, message: 'Admin was deleted successfully' };
 }

 async adminListDomains(c) {
  const res = await this.data.adminListDomains(c.params?.count, c.params?.offset);
  if (!res) return { error: 1, message: 'No domains found' };
  return { error: 0, data: { domains: res } };
 }

 async adminAddDomain(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.name) return { error: 2, message: 'Domain name is missing' };
  c.params.name = c.params.name.toLowerCase();
  if (await this.data.domainExistsByName(c.params.name)) return { error: 3, message: 'This domain already exists' };
  await this.data.adminAddDomain(c.params.name);
  return { error: 0, data: { message: 'Domain was created successfully' } };
 }

 async adminEditDomain(c) {
  return { error: 950, message: 'Not yet implemented' };
 }

 async adminDelDomain(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.domainID) return { error: 2, message: 'Domain ID is missing' };
  if (!(await this.data.domainExistsByID(c.params.domainID))) return { error: 3, message: 'Wrong domain ID' };
  await this.data.adminDelDomain(c.params.domainID);
  return { error: 0, message: 'Domain was deleted successfully' };
 }

 async adminListUsers(c) {
  const res = await this.data.adminListUsers(c.params?.count, c.params?.offset);
  if (!res) return { error: 1, message: 'No users found' };
  return { error: 0, data: { users: res } };
 }

 async adminAddUser(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.username) return { error: 2, message: 'Username is missing' };
  if (!c.params.domainID) return { error: 3, message: 'Domain ID is missing' };
  if (!c.params.visible_name) return { error: 4, message: 'Visible name is missing' };
  if (!c.params.password) return { error: 5, message: 'Password is missing' };
  c.params.username = c.params.username.toLowerCase();
  if (c.params.username.length < 1 || c.params.username.length > 64 || !/^(?!.*[_.-]{2})[a-z0-9]+([_.-]?[a-z0-9]+)*$/.test(c.params.username)) return { error: 6, message: 'Invalid username. Username must be 1-64 characters long, can contain only English alphabet letters, numbers, and special characters (_ . -), but not at the beginning, end, or two in a row' };
  if (!(await this.data.domainExistsByID(c.params.domainID))) return { error: 6, message: 'Wrong domain ID' };
  if (await this.data.userExistsByUserNameAndDomain(c.params.username, c.params.domainID)) return { error: 7, message: 'User already exists' };
  if (c.params.password.length < 8) return { error: 7, message: 'Password has to be 8 or more characters long' };
  await this.data.adminAddUser(c.params.username, c.params.domainID, c.params.visible_name, await this.getHash(c.params.password));
  return { error: 0, message: 'User was added successfully' };
 }

 async adminEditUser(c) {
  return { error: 950, message: 'Not yet implemented' };
 }

 async adminDelUser(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.userID) return { error: 2, message: 'User ID is missing' };
  if (!(await this.data.userExistsByID(c.params.userID))) return { error: 3, message: 'Wrong user ID' };
  await this.data.adminDelUser(c.params.userID);
  return { error: 0, message: 'User was deleted successfully' };
 }

 async userLogin(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.address) return { error: 2, message: 'Address is missing' };
  if (!c.params.password) return { error: 3, message: 'Password is missing' };
  let [username, domain] = c.params.address.split('@');
  if (!username || !domain) return { error: 4, message: 'Invalid username format' };
  username = username.toLowerCase();
  domain = domain.toLowerCase();
  const domainID = await this.data.getDomainID(domain);
  if (!domainID) return { error: 5, message: 'Domain name not found on this server' };
  const userCredentials = await this.data.getUserCredentials(username, domainID);
  if (!userCredentials) return { error: 6, message: 'Wrong user address' };
  if (!(await this.verifyHash(userCredentials.password, c.params.password))) return { error: 7, message: 'Wrong password' };
  const sessionID = this.getNewSessionID();
  await this.data.userSetLogin(userCredentials.id, sessionID);
  return { error: 0, data: { sessionID } };
 }

 async userListSessions(c) {
  const res = await this.data.userListSessions(c.userID, c.params?.count, c.params?.offset);
  if (!res) return { error: 1, message: 'No sessions found for this user' };
  return { error: 0, data: { sessions: res } };
 }

 async userDelSession(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.sessionID) return { error: 2, message: 'Session ID to be deleted not set' };
  if (!(await this.data.userSessionExists(c.userID, c.params.sessionID))) return { error: 3, message: 'Session ID to be deleted not found for this user' };
  await this.data.userDelSession(c.userID, c.sessionID);
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

 getNewSessionID(len) {
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
