import os from 'os';
import Data from './data.js';
//import DNS from './dns.js';
import { Common } from './common.js';

class API {
 constructor(webServer) {
  this.webServer = webServer;
  this.data = new Data();
  //this.dns = new DNS();
  this.allowedEvents = ['new_message', 'seen_message'];
  setInterval(async () => {
   const resAdmin = await this.data.adminDelOldSessions();
   const resUser = await this.data.userDelOldSessions();
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
   admin_info_admin: { method: this.adminInfoAdmin, reqAdminSession: true },
   admin_list_domains: { method: this.adminListDomains, reqAdminSession: true },
   admin_add_domain: { method: this.adminAddDomain, reqAdminSession: true },
   admin_edit_domain: { method: this.adminEditDomain, reqAdminSession: true },
   admin_del_domain: { method: this.adminDelDomain, reqAdminSession: true },
   admin_info_domain: { method: this.adminInfoDomain, reqAdminSession: true },
   admin_list_users: { method: this.adminListUsers, reqAdminSession: true },
   admin_add_user: { method: this.adminAddUser, reqAdminSession: true },
   admin_edit_user: { method: this.adminEditUser, reqAdminSession: true },
   admin_del_user: { method: this.adminDelUser, reqAdminSession: true },
   admin_info_user: { method: this.adminInfoUser, reqAdminSession: true },
   admin_sysinfo: { method: this.adminSysInfo, reqAdminSession: true },
   user_login: { method: this.userLogin },
   user_list_sessions: { method: this.userListSessions, reqUserSession: true },
   user_del_session: { method: this.userDelSession, reqUserSession: true },
   user_get_userinfo: { method: this.userGetUserInfo, reqUserSession: true },
   user_send_message: { method: this.userSendMessage, reqUserSession: true },
   user_message_seen: { method: this.userMessageSeen, reqUserSession: true },
   user_list_conversations: { method: this.userListConversations, reqUserSession: true },
   user_list_messages: { method: this.userListMessages, reqUserSession: true },
   user_subscribe: { method: this.userSubscribe, reqUserSession: true },
   user_unsubscribe: { method: this.userUnsubscribe, reqUserSession: true }
  };
 }

 async processAPI(ws, json) {
  if (!Common.isValidJSON(json)) return { error: 902, message: 'Invalid JSON command' };
  const req = JSON.parse(json);
  let resp = {};
  if (req.requestID) resp.requestID = req.requestID;
  if (!req.command) return { ...resp, error: 999, message: 'Command not set' };
  const apiMethod = this.apiMethods[req.command];
  if (!apiMethod) return { ...resp, error: 903, message: 'Unknown command' };
  const context = { ws };
  if (apiMethod.reqAdminSession) {
   if (!req.sessionID) return { ...resp, error: 995, message: 'Admin session is missing' };
   if (!(await this.data.adminCheckSession(req.sessionID))) return { ...resp, error: 997, message: 'Invalid admin session ID' };
   if (await this.data.adminSessionExpired(req.sessionID)) return { ...resp, error: 994, message: 'Admin session is expired' };
   await this.data.adminUpdateSessionTime(req.sessionID);
   const adminID = await this.data.getAdminIDBySession(req.sessionID);
   if (adminID) context.adminID = adminID;
  } else if (apiMethod.reqUserSession) {
   if (!req.sessionID) return { ...resp, error: 996, message: 'User session is missing' };
   if (!(await this.data.userCheckSession(req.sessionID))) return { ...resp, error: 998, message: 'Invalid user session ID' };
   if (await this.data.userSessionExpired(req.sessionID)) return { ...resp, error: 994, message: 'User session is expired' };
   await this.data.userUpdateSessionTime(req.sessionID);
   const userID = await this.data.getUserIDBySession(req.sessionID);
   if (userID) context.userID = userID;
  }
  if (req.sessionID) context.sessionID = req.sessionID;
  if (req.params) context.params = req.params;
  //console.log('SENDING CONTEXT:', context);
  let method_result = await apiMethod.method.call(this, context);
  return { ...resp, ...method_result };
 }

 async adminLogin(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.username) return { error: 2, message: 'Username is missing' };
  if (!c.params.password) return { error: 3, message: 'Password is missing' };
  c.params.username = c.params.username.toLowerCase();
  const adminCredentials = await this.data.getAdminCredentials(c.params.username);
  if (!adminCredentials) return { error: 4, message: 'Wrong username' };
  if (!this.data.verifyHash(adminCredentials.password, c.params.password)) return { error: 5, message: 'Wrong password' };
  const sessionID = this.getUUID();
  await this.data.adminSetLogin(adminCredentials.id, sessionID);
  return { error: 0, data: { sessionID } };
 }

 async adminListSessions(c) {
  let orderBy = 'id';
  if (c.params?.orderBy) {
   const validOrderBy = ['id', 'session', 'last', 'created'];
   orderBy = c.params.orderBy.toLowerCase();
   if (!validOrderBy.includes(orderBy)) return { error: 1, message: 'Invalid column name in orderBy parameter' };
  }
  let direction = 'ASC';
  if (c.params?.direction) {
   const validDirection = ['ASC', 'DESC'];
   direction = c.params.direction.toUpperCase();
   if (!validDirection.includes(direction)) return { error: 2, message: 'Invalid direction in direction parameter' };
  }
  return { error: 0, data: { sessions: await this.data.adminListSessions(c.adminID, c.params?.count, c.params?.offset, orderBy, direction, c.params?.filterName) } };
 }

 async adminDelSession(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.sessionID) return { error: 2, message: 'Session ID to be deleted not set' };
  if (!(await this.data.adminSessionExists(c.adminID, c.params.sessionID))) return { error: 3, message: 'Session ID to be deleted not found for this admin' };
  await this.data.adminDelSession(c.adminID, c.params.sessionID);
  return { error: 0, message: 'Session was deleted' };
 }

 async adminListAdmins(c) {
  let orderBy = 'id';
  if (c.params?.orderBy) {
   const validOrderBy = ['id', 'username', 'created'];
   orderBy = c.params.orderBy.toLowerCase();
   if (!validOrderBy.includes(orderBy)) return { error: 1, message: 'Invalid column name in orderBy parameter' };
  }
  let direction = 'ASC';
  if (c.params?.direction) {
   const validDirection = ['ASC', 'DESC'];
   direction = c.params.direction.toUpperCase();
   if (!validDirection.includes(direction)) return { error: 2, message: 'Invalid direction in direction parameter' };
  }
  return { error: 0, data: { admins: await this.data.adminListAdmins(c.params?.count, c.params?.offset, orderBy, direction, c.params?.filterName) } };
 }

 async adminAddAdmin(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.username) return { error: 2, message: 'Username is missing' };
  if (!c.params.password) return { error: 3, message: 'Password is missing' };
  c.params.username = c.params.username.toLowerCase();
  if (await this.data.adminExistsByUsername(c.params.username)) return { error: 4, message: 'This admin already exists' };
  if (c.params.username.length < 3 || c.params.username.length > 16 || !/^(?!.*[_.-]{2})[a-z0-9]+([_.-]?[a-z0-9]+)*$/.test(c.params.username)) return { error: 5, message: 'Invalid username. Username must be 3-16 characters long, can contain only English alphabet letters, numbers, and special characters (_ . -), but not at the beginning, end, or two in a row' };
  if (c.params.password.length < 8) return { error: 6, message: 'Password has to be 8 or more characters long' };
  await this.data.adminAddAdmin(c.params.username, c.params.password);
  return { error: 0, data: { message: 'Admin was created successfully' } };
 }

 async adminEditAdmin(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.adminID) return { error: 2, message: 'Admin ID is missing' };
  if (!(await this.data.adminExistsByID(c.params.adminID))) return { error: 3, message: 'Wrong admin ID' };
  if (!c.params.username && !c.params.password) return { error: 4, message: 'Admin username or admin password has to be in parameters' };
  // TODO: check if another admin with the same username, but with a different user ID already exists, the following doesn't count with different user ID:
  //if (await this.data.adminExistsByUsername(c.params.username)) return { error: 5, message: 'This admin already exists' };
  await this.data.adminEditAdmin(c.params.adminID, c.params.username, c.params.password);
  return { error: 0, message: 'Admin was edited successfully' };
 }

 async adminDelAdmin(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.adminID) return { error: 2, message: 'Admin ID is missing' };
  if (!(await this.data.adminExistsByID(c.params.adminID))) return { error: 3, message: 'Wrong admin ID' };
  await this.data.adminDelAdmin(c.params.adminID);
  return { error: 0, message: 'Admin was deleted successfully' };
 }

 async adminInfoAdmin(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.adminID) return { error: 2, message: 'Admin ID is missing' };
  const res = await this.data.getAdminInfoByID(c.params.adminID);
  if (!res) return { error: 3, message: 'Wrong admin ID' };
  return { error: 0, data: res };
 }

 async adminListDomains(c) {
  let orderBy = 'id';
  if (c.params?.orderBy) {
   const validOrderBy = ['id', 'name', 'users_count', 'created'];
   orderBy = c.params.orderBy.toLowerCase();
   if (!validOrderBy.includes(orderBy)) return { error: 1, message: 'Invalid column name in orderBy parameter' };
  }
  let direction = 'ASC';
  if (c.params?.direction) {
   const validDirection = ['ASC', 'DESC'];
   direction = c.params.direction.toUpperCase();
   if (!validDirection.includes(direction)) return { error: 2, message: 'Invalid direction in direction parameter' };
  }
  return { error: 0, data: { domains: await this.data.adminListDomains(c.params?.count, c.params?.offset, orderBy, direction, c.params?.filterName) } };
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
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.domainID) return { error: 2, message: 'Domain ID is missing' };
  if (!(await this.data.domainExistsByID(c.params.domainID))) return { error: 3, message: 'Wrong domain ID' };
  if (!c.params.name) return { error: 4, message: 'Domain name is missing' };
  await this.data.adminEditDomain(c.params.domainID, c.params.name);
  return { error: 0, message: 'Domain was edited successfully' };
 }

 async adminDelDomain(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.domainID) return { error: 2, message: 'Domain ID is missing' };
  if (!(await this.data.domainExistsByID(c.params.domainID))) return { error: 3, message: 'Wrong domain ID' };
  if ((await this.data.adminCountUsers(c.params.domainID)) > 0) return { error: 4, message: 'Cannot delete this domain, as it still has some users' };
  await this.data.adminDelDomain(c.params.domainID);
  return { error: 0, message: 'Domain was deleted successfully' };
 }

 async adminInfoDomain(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.domainID) return { error: 2, message: 'Domain ID is missing' };
  const res = await this.data.getDomainInfoByID(c.params.domainID);
  if (!res) return { error: 3, message: 'Wrong domain ID' };
  return { error: 0, data: res };
 }

 async adminListUsers(c) {
  let orderBy = 'id';
  if (c.params?.orderBy) {
   const validOrderBy = ['id', 'address', 'visible_name', 'created'];
   orderBy = c.params.orderBy.toLowerCase();
   if (!validOrderBy.includes(orderBy)) return { error: 1, message: 'Invalid column name in orderBy parameter' };
  }
  let direction = 'ASC';
  if (c.params?.direction) {
   const validDirection = ['ASC', 'DESC'];
   direction = c.params.direction.toUpperCase();
   if (!validDirection.includes(direction)) return { error: 2, message: 'Invalid direction in direction parameter' };
  }
  return { error: 0, data: { users: await this.data.adminListUsers(c.params?.count, c.params?.offset, orderBy, direction, c.params?.filterUsername, c.params?.filterDomainID) } };
 }

 async adminAddUser(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.username) return { error: 2, message: 'Username is missing' };
  if (!c.params.domainID) return { error: 3, message: 'Domain ID is missing' };
  if (!c.params.visible_name) return { error: 4, message: 'Visible name is missing' };
  if (!c.params.password) return { error: 5, message: 'Password is missing' };
  c.params.username = c.params.username.toLowerCase();
  if (c.params.username.length < 1 || c.params.username.length > 64 || !/^(?!.*[_.-]{2})[a-z0-9]+([_.-]?[a-z0-9]+)*$/.test(c.params.username)) return { error: 6, message: 'Invalid username. Username must be 1-64 characters long, can contain only English alphabet letters, numbers, and special characters (_ . -), but not at the beginning, end, or two in a row' };

  // TRANSACTION BEGIN

  if (!(await this.data.domainExistsByID(c.params.domainID))) return { error: 6, message: 'Wrong domain ID' };
  if (await this.data.userExistsByUserNameAndDomain(c.params.username, c.params.domainID)) return { error: 7, message: 'User already exists' };
  if (c.params.password.length < 8) return { error: 7, message: 'Password has to be 8 or more characters long' };
  await this.data.adminAddUser(c.params.username, c.params.domainID, c.params.visible_name, c.params.password);

  // TRANSACTION END

  return { error: 0, message: 'User was added successfully' };
 }

 async adminEditUser(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.userID) return { error: 2, message: 'User ID is missing' };
  if (!c.params.username && !c.params.domainID && !c.params.visible_name && !c.params.password) return { error: 4, message: 'Username, domain ID, visible_name or password has to be in parameters' };
  c.params.username = c.params.username.toLowerCase();
  if (c.params.username) {
   if (c.params.username.length < 1 || c.params.username.length > 64 || !/^(?!.*[_.-]{2})[a-z0-9]+([_.-]?[a-z0-9]+)*$/.test(c.params.username)) return { error: 5, message: 'Invalid username. Username must be 1-64 characters long, can contain only English alphabet letters, numbers, and special characters (_ . -), but not at the beginning, end, or two in a row' };
  }

  // TRANSACTION BEGIN

  if (!(await this.data.userExistsByID(c.params.userID))) return { error: 3, message: 'Wrong user ID' };

  if (c.params.domainID) {
   if (!(await this.data.domainExistsByID(c.params.domainID))) return { error: 6, message: 'Wrong domain ID' };
  }
  if (await this.data.userExistsByUserNameAndDomain(c.params.username, c.params.domainID, c.params.userID)) return { error: 7, message: 'User already exists' };
  if (c.params.password) {
   if (c.params.password.length < 8) return { error: 8, message: 'Password has to be 8 or more characters long' };
  }
  await this.data.adminEditUser(c.params.userID, c.params.username, c.params.domainID, c.params.visible_name, c.params.password);

  // TRANSACTION END

  return { error: 0, message: 'User was edited successfully' };
 }

 async adminDelUser(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.userID) return { error: 2, message: 'User ID is missing' };
  if (!(await this.data.userExistsByID(c.params.userID))) return { error: 3, message: 'Wrong user ID' };
  await this.data.adminDelUser(c.params.userID);
  return { error: 0, message: 'User was deleted successfully' };
 }

 async adminInfoUser(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.userID) return { error: 2, message: 'User ID is missing' };
  const res = await this.data.getUserInfoByID(c.params.userID);
  if (!res) return { error: 3, message: 'Wrong user ID' };
  return { error: 0, data: res };
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
   error: 0,
   data: {
    app: {
     name: Common.appName,
     version: Common.appVersion
    },
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
   }
  };
 }

 async userLogin(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.address) return { error: 2, message: 'Address is missing' };
  if (!c.params.password) return { error: 3, message: 'Password is missing' };
  let [username, domain] = c.params.address.split('@');
  if (!username || !domain) return { error: 4, message: 'Invalid address format' };
  username = username.toLowerCase();
  domain = domain.toLowerCase();
  const domainID = await this.data.getDomainIDByName(domain);
  if (!domainID) return { error: 5, message: 'Domain name not found on this server' };
  const userCredentials = await this.data.getUserCredentials(username, domainID);
  if (!userCredentials) return { error: 6, message: 'Wrong user address' };
  console.log(userCredentials.password, c.params.password);
  if (!this.data.verifyHash(userCredentials.password, c.params.password)) return { error: 7, message: 'Wrong password' };
  const sessionID = this.getUUID();
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

 async userGetUserInfo(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.address) return { error: 2, message: 'Address is missing' };
  let [username, domain] = c.params.address.split('@');
  if (!username || !domain) return { error: 4, message: 'Invalid username format' };
  username = username.toLowerCase();
  domain = domain.toLowerCase();
  const domainID = await this.data.getDomainIDByName(domain);
  if (!domainID) return { error: 5, message: 'Domain name not found on this server' };
  const userID = await this.data.getUserIDByUsernameAndDomainID(username, domainID);
  if (!userID) return { error: 6, message: 'User name not found on this server' };
  const userInfo = await this.data.userGetUserInfo(userID);
  return { error: 0, data: userInfo };
 }

 async userSendMessage(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.address) return { error: 2, message: 'Recipient address is missing' };
  let [usernameTo, domainTo] = c.params.address.split('@');
  if (!usernameTo || !domainTo) return { error: 4, message: 'Invalid username format' };
  usernameTo = usernameTo.toLowerCase();
  domainTo = domainTo.toLowerCase();
  const domainToID = await this.data.getDomainIDByName(domainTo);
  if (!domainToID) return { error: 5, message: 'Domain name not found on this server' };
  const userToID = await this.data.getUserIDByUsernameAndDomainID(usernameTo, domainToID);
  if (!userToID) return { error: 6, message: 'User name not found on this server' };
  const userFromInfo = await this.data.userGetUserInfo(c.userID);
  const userFromDomain = await this.data.getDomainNameByID(userFromInfo.id_domains);
  if (!c.params.message) return { error: 7, message: 'Message is missing' };
  if (!c.params.uid) return { error: 8, message: 'Message UID is missing' };
  const uid = c.params.uid;
  const res = await this.data.userSendMessage(c.userID, uid, userFromInfo.username + '@' + userFromDomain, usernameTo + '@' + domainTo, c.params.message);
  if (userToID !== userFromInfo.id) await this.data.userSendMessage(userToID, uid, userFromInfo.username + '@' + userFromDomain, usernameTo + '@' + domainTo, c.params.message);
  const msg = {
   id: res.lastInsertRowid,
   uid,
   address_from: userFromInfo.username + '@' + userFromDomain,
   address_to: usernameTo + '@' + domainTo,
   message: c.params.message
  };
  this.notifySubscriber(userToID, 'new_message', msg);
  this.notifySubscriber(c.userID, 'new_message', msg);
  return { error: 0, message: 'Message sent', uid };
 }

 async userMessageSeen(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.uid) return { error: 2, message: 'Message UID is missing' };
  const res = await this.data.userGetMessage(c.userID, c.params.uid);
  if (!res) return { error: 3, message: 'Wrong message ID' };
  if (res.seen) return { error: 4, message: 'Seen flag was already set' };
  await this.data.userMessageSeen(c.params.uid);
  const res2 = await this.data.userGetMessage(c.userID, c.params.uid);
  const [username, domain] = res2.address_from.split('@');
  const userFromID = await this.data.getUserIDByUsernameAndDomain(username, domain);
  this.notifySubscriber(userFromID, 'seen_message', {
   uid: c.params.uid,
   seen: res2.seen
  });
  return { error: 0, message: 'Seen flag set successfully' };
 }

 async userListConversations(c) {
  const conversations = await this.data.userListConversations(c.userID);
  if (!conversations) return { error: 1, message: 'No conversations found' };
  return { error: 0, data: { conversations } };
 }

 async userListMessages(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.address) return { error: 2, message: 'Recipient address is missing' };
  const messages = await this.data.userListMessages(c.userID, c.params.address, c.params?.count, c.params?.lastID);
  return { error: 0, data: { messages } };
 }

 userSubscribe(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.event) return { error: 2, message: 'Event parameter is missing' };
  if (!this.allowedEvents.includes(c.params.event)) return { error: 3, message: 'Unsupported event name' };
  const clientData = this.webServer.wsClients.get(c.ws);
  if (!clientData) return { error: 4, message: 'Client not found' };
  clientData.userID = c.userID;
  clientData.subscriptions.add(c.params.event);
  Common.addLog('Client ' + c.ws.remoteAddress + ' subscribed to event: ' + c.params.event);
  return { error: 0, message: 'Event subscribed' };
 }

 notifySubscriber(userID, event, data) {
  const clients = this.webServer.wsClients;
  for (const [ws, clientData] of clients) {
   if (clientData.userID === userID && clientData.subscriptions.has(event)) {
    const res = JSON.stringify({ event, data });
    Common.addLog('WebSocket event to: ' + ws.remoteAddress + ', message: ' + res);
    ws.send(res);
   }
  }
 }

 userUnsubscribe(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.event) return { error: 2, message: 'Event parameter is missing' };
  if (!this.allowedEvents.includes(c.params.event)) return { error: 3, message: 'Unsupported event name' };
  const clientData = this.webServer.wsClients.get(c.ws);
  if (!clientData) return { error: 4, message: 'Client not found' };
  if (!clientData.subscriptions?.has(c.params.event)) return { error: 5, message: 'Client is not subscribed to this event' };
  clientData.subscriptions?.delete(c.params.event);
  return { error: 0, message: 'Event unsubscribed' };
 }

 getUUID() {
  return crypto.randomUUID();
 }
}

export default API;
