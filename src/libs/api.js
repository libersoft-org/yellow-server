import os from 'os';
import Crypto from 'crypto';
import Data from './data.js';
//import DNS from './dns.js';
import { Common } from './common.js';

class API {
 constructor(webServer) {
  this.webServer = webServer;
  this.data = new Data();
  //this.dns = new DNS();
  setInterval(() => {
   const resAdmin = this.data.adminDelOldSessions();
   const resUser = this.data.userDelOldSessions();
   Common.addLog('Expired sessions cleaner: ' + resAdmin.changes + ' admin sessions and ' + resUser.changes + ' user sessions deleted.');
  }, Common.settings.other.session_cleaner * 1000);
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
   user_del_session: { method: this.userDelSession, reqUserSession: true },
   user_get_userinfo: { method: this.userGetUserInfo, reqUserSession: true },
   user_send_message: { method: this.userSendMessage, reqUserSession: true },
   user_list_messages: { method: this.userListMessages, reqUserSession: true },
   user_subscribe_messages: { method: this.userSubscribeMessages, reqUserSession: true }
  };
 }

 async processAPI(ws, json) {
  if (!Common.isValidJSON(json)) return { error: 902, message: 'Invalid JSON command' };
  const req = JSON.parse(json);
  if (!req.command) return { error: 999, message: 'Command not set' };
  const apiMethod = this.apiMethods[req.command];
  if (!apiMethod) return { error: 903, message: 'Unknown command' };
  const context = { ws };
  if (apiMethod.reqAdminSession) {
   if (!req.sessionID) return { error: 995, message: 'Admin session is missing' };
   if (!this.data.adminCheckSession(req.sessionID)) return { error: 997, message: 'Invalid admin session ID' };
   if (this.data.adminSessionExpired(req.sessionID)) return { error: 994, message: 'Admin session is expired' };
   this.data.adminUpdateSessionTime(req.sessionID);
   const adminID = this.data.getAdminIDBySession(req.sessionID);
   if (adminID) context.adminID = adminID;
  } else if (apiMethod.reqUserSession) {
   if (!req.sessionID) return { error: 996, message: 'User session is missing' };
   if (!this.data.userCheckSession(req.sessionID)) return { error: 998, message: 'Invalid user session ID' };
   if (this.data.userSessionExpired(req.sessionID)) return { error: 994, message: 'User session is expired' };
   this.data.userUpdateSessionTime(req.sessionID);
   const userID = this.data.getUserIDBySession(req.sessionID);
   if (userID) context.userID = userID;
  }
  if (req.sessionID) context.sessionID = req.sessionID;
  if (req.params) context.params = req.params;
  //console.log('SENDING CONTEXT:', context);
  return await apiMethod.method.call(this, context);
 }

 adminLogin(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.username) return { error: 2, message: 'Username is missing' };
  if (!c.params.password) return { error: 3, message: 'Password is missing' };
  c.params.username = c.params.username.toLowerCase();
  const adminCredentials = this.data.getAdminCredentials(c.params.username);
  if (!adminCredentials) return { error: 4, message: 'Wrong username' };
  if (!this.data.verifyHash(adminCredentials.password, c.params.password)) return { error: 5, message: 'Wrong password' };
  const sessionID = this.getNewSessionID();
  this.data.adminSetLogin(adminCredentials.id, sessionID);
  return { error: 0, data: { sessionID } };
 }

 adminListSessions(c) {
  const res = this.data.adminListSessions(c.adminID, c.params?.count, c.params?.offset);
  if (!res) return { error: 1, message: 'No sessions found for this user' };
  return { error: 0, data: { sessions: res } };
 }

 adminDelSession(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.sessionID) return { error: 2, message: 'Session ID to be deleted not set' };
  if (!this.data.adminSessionExists(c.adminID, c.params.sessionID)) return { error: 3, message: 'Session ID to be deleted not found for this admin' };
  this.data.adminDelSession(c.adminID, c.params.sessionID);
  return { error: 0, message: 'Session was deleted' };
 }

 adminListAdmins(c) {
  const res = this.data.adminListAdmins(c.params?.count, c.params?.offset);
  if (!res) return { error: 1, message: 'No admins found' };
  return { error: 0, data: { admins: res } };
 }

 adminAddAdmin(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.username) return { error: 2, message: 'Username is missing' };
  if (!c.params.password) return { error: 3, message: 'Password is missing' };
  c.params.username = c.params.username.toLowerCase();
  if (this.data.adminExistsByUsername(c.params.username)) return { error: 4, message: 'This admin already exists' };
  if (c.params.username.length < 3 || c.params.username.length > 16 || !/^(?!.*[_.-]{2})[a-z0-9]+([_.-]?[a-z0-9]+)*$/.test(c.params.username)) return { error: 5, message: 'Invalid username. Username must be 3-16 characters long, can contain only English alphabet letters, numbers, and special characters (_ . -), but not at the beginning, end, or two in a row' };
  if (c.params.password.length < 8) return { error: 6, message: 'Password has to be 8 or more characters long' };
  this.data.adminAddAdmin(c.params.username, c.params.password);
  return { error: 0, data: { message: 'Admin was created successfully' } };
 }

 adminEditAdmin(c) {
  return { error: 950, message: 'Not yet implemented' };
 }

 adminDelAdmin(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.adminID) return { error: 2, message: 'Admin ID is missing' };
  if (!this.data.adminExistsByID(c.params.adminID)) return { error: 3, message: 'Wrong admin ID' };
  this.data.adminDelAdmin(c.params.adminID);
  return { error: 0, message: 'Admin was deleted successfully' };
 }

 adminListDomains(c) {
  const res = this.data.adminListDomains(c.params?.count, c.params?.offset);
  if (!res) return { error: 1, message: 'No domains found' };
  return { error: 0, data: { domains: res } };
 }

 adminAddDomain(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.name) return { error: 2, message: 'Domain name is missing' };
  c.params.name = c.params.name.toLowerCase();
  if (this.data.domainExistsByName(c.params.name)) return { error: 3, message: 'This domain already exists' };
  this.data.adminAddDomain(c.params.name);
  return { error: 0, data: { message: 'Domain was created successfully' } };
 }

 adminEditDomain(c) {
  return { error: 950, message: 'Not yet implemented' };
 }

 adminDelDomain(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.domainID) return { error: 2, message: 'Domain ID is missing' };
  if (!this.data.domainExistsByID(c.params.domainID)) return { error: 3, message: 'Wrong domain ID' };
  if (this.data.adminCountUsers(c.params.domainID) > 0) return { error: 4, message: 'Cannot delete this domain, as it still has some users' };
  this.data.adminDelDomain(c.params.domainID);
  return { error: 0, message: 'Domain was deleted successfully' };
 }

 adminListUsers(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.domainID) return { error: 2, message: 'Domain ID is missing' };
  const res = this.data.adminListUsers(c.params.domainID, c.params?.count, c.params?.offset);
  if (!res) return { error: 1, message: 'No users found' };
  return { error: 0, data: { users: res } };
 }

 adminAddUser(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.username) return { error: 2, message: 'Username is missing' };
  if (!c.params.domainID) return { error: 3, message: 'Domain ID is missing' };
  if (!c.params.visible_name) return { error: 4, message: 'Visible name is missing' };
  if (!c.params.password) return { error: 5, message: 'Password is missing' };
  c.params.username = c.params.username.toLowerCase();
  if (c.params.username.length < 1 || c.params.username.length > 64 || !/^(?!.*[_.-]{2})[a-z0-9]+([_.-]?[a-z0-9]+)*$/.test(c.params.username)) return { error: 6, message: 'Invalid username. Username must be 1-64 characters long, can contain only English alphabet letters, numbers, and special characters (_ . -), but not at the beginning, end, or two in a row' };
  if (!this.data.domainExistsByID(c.params.domainID)) return { error: 6, message: 'Wrong domain ID' };
  if (this.data.userExistsByUserNameAndDomain(c.params.username, c.params.domainID)) return { error: 7, message: 'User already exists' };
  if (c.params.password.length < 8) return { error: 7, message: 'Password has to be 8 or more characters long' };
  this.data.adminAddUser(c.params.username, c.params.domainID, c.params.visible_name, c.params.password);
  return { error: 0, message: 'User was added successfully' };
 }

 adminEditUser(c) {
  return { error: 950, message: 'Not yet implemented' };
 }

 adminDelUser(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.userID) return { error: 2, message: 'User ID is missing' };
  if (!this.data.userExistsByID(c.params.userID)) return { error: 3, message: 'Wrong user ID' };
  this.data.adminDelUser(c.params.userID);
  return { error: 0, message: 'User was deleted successfully' };
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

 userLogin(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.address) return { error: 2, message: 'Address is missing' };
  if (!c.params.password) return { error: 3, message: 'Password is missing' };
  let [username, domain] = c.params.address.split('@');
  if (!username || !domain) return { error: 4, message: 'Invalid username format' };
  username = username.toLowerCase();
  domain = domain.toLowerCase();
  const domainID = this.data.getDomainIDByName(domain);
  if (!domainID) return { error: 5, message: 'Domain name not found on this server' };
  const userCredentials = this.data.getUserCredentials(username, domainID);
  if (!userCredentials) return { error: 6, message: 'Wrong user address' };
  if (!this.data.verifyHash(userCredentials.password, c.params.password)) return { error: 7, message: 'Wrong password' };
  const sessionID = this.getNewSessionID();
  this.data.userSetLogin(userCredentials.id, sessionID);
  return { error: 0, data: { sessionID } };
 }

 userListSessions(c) {
  const res = this.data.userListSessions(c.userID, c.params?.count, c.params?.offset);
  if (!res) return { error: 1, message: 'No sessions found for this user' };
  return { error: 0, data: { sessions: res } };
 }

 userDelSession(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.sessionID) return { error: 2, message: 'Session ID to be deleted not set' };
  if (!this.data.userSessionExists(c.userID, c.params.sessionID)) return { error: 3, message: 'Session ID to be deleted not found for this user' };
  this.data.userDelSession(c.userID, c.sessionID);
  return { error: 0, message: 'Session was deleted' };
 }

 userGetUserInfo(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.address) return { error: 2, message: 'Address is missing' };
  let [username, domain] = c.params.address.split('@');
  if (!username || !domain) return { error: 4, message: 'Invalid username format' };
  username = username.toLowerCase();
  domain = domain.toLowerCase();
  const domainID = this.data.getDomainIDByName(domain);
  if (!domainID) return { error: 5, message: 'Domain name not found on this server' };
  const userID = this.data.getUserIDByUsernameAndDomainID(username, domainID);
  if (!userID) return { error: 6, message: 'User name not found on this server' };
  const userInfo = this.data.userGetUserInfo(userID);
  return { error: 0, data: userInfo };
 }

 userSendMessage(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.address) return { error: 2, message: 'Recipient address is missing' };
  let [usernameTo, domainTo] = c.params.address.split('@');
  if (!usernameTo || !domainTo) return { error: 4, message: 'Invalid username format' };
  usernameTo = usernameTo.toLowerCase();
  domainTo = domainTo.toLowerCase();
  const domainToID = this.data.getDomainIDByName(domainTo);
  if (!domainToID) return { error: 5, message: 'Domain name not found on this server' };
  const userToID = this.data.getUserIDByUsernameAndDomainID(usernameTo, domainToID);
  if (!userToID) return { error: 6, message: 'User name not found on this server' };
  const userFromInfo = this.data.userGetUserInfo(c.userID);
  const userFromDomain = this.data.getDomainNameByID(userFromInfo.id_domains);
  if (!c.params.message) return { error: 7, message: 'Message is missing' };
  this.data.userSendMessage(c.userID, userFromInfo.username + '@' + userFromDomain, usernameTo + '@' + domainTo, c.params.message);
  this.data.userSendMessage(userToID, userFromInfo.username + '@' + userFromDomain, usernameTo + '@' + domainTo, c.params.message);
  this.notifySubscribers('new_message', {
   from: userFromInfo.username + '@' + domainTo,
   to: usernameTo + '@' + domainTo,
   message: c.params.message
  });
  return { error: 0, message: 'Message sent' };
 }

 userListMessages(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.address) return { error: 2, message: 'Recipient address is missing' };
  const messages = this.data.userListMessages(c.userID, c.params.address, c.params?.count, c.params?.offset);
  if (!messages) return { error: 3, message: 'No messages found' };
  return { error: 0, data: { messages } };
 }

 userSubscribeMessages(c) {
  const clientData = this.webServer.wsClients.get(c.ws);
  if (!clientData) return { error: 990, message: 'Client not found' };
  clientData.subscriptions.add('messages');
  Common.addLog('Client ' + c.ws.remoteAddress + ' subscribed to messages event');
  return { error: 0, message: 'Subscribed to messages event' };
 }

 notifySubscribers(event, data) {
  const clients = this.webServer.wsClients;
  for (const [ws, clientData] of clients) {
   if (clientData.subscriptions.has(event)) ws.send(JSON.stringify({ event, data }));
  }
 }

 getNewSessionID(len) {
  return Crypto.randomBytes(16).toString('hex') + Date.now().toString(16);
 }
}

export default API;
