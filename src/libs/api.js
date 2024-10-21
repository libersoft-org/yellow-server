import os from 'os';
import Data from './data.js';
//import DNS from './dns.js';
import { Info } from './info.js';
import { Log } from 'yellow-server-common';

class API {
 constructor(webServer) {
  this.webServer = webServer;
  this.data = new Data();
  //this.dns = new DNS();
  this.allowedEvents = ['new_message', 'seen_message'];
  setInterval(async () => {
   const resAdmin = await this.data.adminDelOldSessions();
   const resUser = await this.data.userDelOldSessions();
   if (resAdmin.changes || resUser.changes) Log.info('Expired sessions cleaner: ' + (resAdmin.changes || 0) + ' admin sessions and ' + (resUser.changes || 0) + ' user sessions deleted.');
  }, Info.settings.other.session_cleaner * 1000);
  this.commands = {
   admin_login: { method: this.adminLogin },
   admin_sessions_list: { method: this.adminSessionsList, reqAdminSession: true },
   admin_sessions_del: { method: this.adminSessionsDel, reqAdminSession: true },
   admin_admins_list: { method: this.adminAdminsList, reqAdminSession: true },
   admin_admins_add: { method: this.adminAdminsAdd, reqAdminSession: true },
   admin_admins_edit: { method: this.adminAdminsEdit, reqAdminSession: true },
   admin_admins_del: { method: this.adminAdminsDel, reqAdminSession: true },
   admin_admins_info: { method: this.adminAdminsInfo, reqAdminSession: true },
   admin_domains_list: { method: this.adminDomainsList, reqAdminSession: true },
   admin_domains_add: { method: this.adminDomainsAdd, reqAdminSession: true },
   admin_domains_edit: { method: this.adminDomainsEdit, reqAdminSession: true },
   admin_domains_del: { method: this.adminDomainsDel, reqAdminSession: true },
   admin_domains_info: { method: this.adminDomainsInfo, reqAdminSession: true },
   admin_users_list: { method: this.adminUsersList, reqAdminSession: true },
   admin_users_add: { method: this.adminUsersAdd, reqAdminSession: true },
   admin_users_edit: { method: this.adminUsersEdit, reqAdminSession: true },
   admin_users_del: { method: this.adminUsersDel, reqAdminSession: true },
   admin_users_info: { method: this.adminUsersInfo, reqAdminSession: true },
   admin_modules_list: { method: this.adminModulesList, reqAdminSession: true },
   admin_modules_add: { method: this.adminModulesAdd, reqAdminSession: true },
   admin_modules_edit: { method: this.adminModulesEdit, reqAdminSession: true },
   admin_modules_del: { method: this.adminModulesDel, reqAdminSession: true },
   admin_modules_info: { method: this.adminModulesInfo, reqAdminSession: true },
   admin_sysinfo: { method: this.adminSysInfo, reqAdminSession: true },
   user_login: { method: this.userLogin },

   user_sessions_list: { method: this.userListSessions, reqUserSession: true },
   user_session_del: { method: this.userDelSession, reqUserSession: true },
   user_userinfo_get: { method: this.userGetUserInfo, reqUserSession: true },
   user_subscribe: { method: this.userSubscribe, reqUserSession: true },
   user_unsubscribe: { method: this.userUnsubscribe, reqUserSession: true },
   user_heartbeat: { method: this.userHeartbeat, reqUserSession: true }
  };
 }

 async processAPI(ws, json) {
  if (!this.isValidJSON(json)) return { error: 902, message: 'Invalid JSON command' };
  const req = JSON.parse(json);
  let resp = {};
  if (req.requestID) resp.requestID = req.requestID;
  if (!req.command && !req.module) return { ...resp, error: 999, message: 'Command or module not set' };
  const context = { ws };
  if (req.command) {
   const command = this.commands[req.command];
   if (!command) return { ...resp, error: 903, message: 'Unknown command' };
   if (command.reqAdminSession) {
    if (!req.sessionID) return { ...resp, error: 995, message: 'Admin session is missing' };
    if (!(await this.data.adminSessionCheck(req.sessionID))) return { ...resp, error: 997, message: 'Invalid admin session ID' };
    if (await this.data.adminSessionExpired(req.sessionID)) return { ...resp, error: 994, message: 'Admin session is expired' };
    await this.data.adminUpdateSessionTime(req.sessionID);
    const adminID = await this.data.getAdminIDBySession(req.sessionID);
    if (adminID) context.adminID = adminID;
   } else if (command.reqUserSession) {
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
   let method_result = await command.method.call(this, context);
   return { ...resp, ...method_result };
  }
  if (req.module) {
   let msg = {
    auth: {},
    data: {}
   };
   return {};
  }
 }

 async adminLogin(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.username) return { error: 2, message: 'Username is missing' };
  if (!c.params.password) return { error: 3, message: 'Password is missing' };
  c.params.username = c.params.username.toLowerCase();
  const adminCredentials = await this.data.getAdminCredentials(c.params.username);
  if (!adminCredentials) return { error: 4, message: 'Wrong username' };

  Log.debug('adminCredentials:', adminCredentials);
  Log.debug('c.params:', c.params);
  Log.debug('c.params.password:', c.params.password);

  if (!this.data.verifyHash(adminCredentials.password, c.params.password)) return { error: 5, message: 'Wrong password' };
  const sessionID = this.getUUID();
  await this.data.adminSetLogin(adminCredentials.id, sessionID);
  return { error: 0, data: { sessionID } };
 }

 async adminSessionsList(c) {
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
  return { error: 0, data: { sessions: await this.data.adminSessionsList(c.adminID, c.params?.count, c.params?.offset, orderBy, direction, c.params?.filterName) } };
 }

 async adminSessionsDel(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.sessionID) return { error: 2, message: 'Session ID to be deleted not set' };
  if (!(await this.data.adminSessionExists(c.adminID, c.params.sessionID))) return { error: 3, message: 'Session ID to be deleted not found for this admin' };
  await this.data.adminSessionsDel(c.adminID, c.params.sessionID);
  return { error: 0, message: 'Session was deleted' };
 }

 async adminAdminsList(c) {
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
  return { error: 0, data: { admins: await this.data.adminAdminsList(c.params?.count, c.params?.offset, orderBy, direction, c.params?.filterName) } };
 }

 async adminAdminsAdd(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.username) return { error: 2, message: 'Username is missing' };
  if (!c.params.password) return { error: 3, message: 'Password is missing' };
  c.params.username = c.params.username.toLowerCase();
  if (await this.data.adminExistsByUsername(c.params.username)) return { error: 4, message: 'This admin already exists' };
  if (c.params.username.length < 3 || c.params.username.length > 16 || !/^(?!.*[_.-]{2})[a-z0-9]+([_.-]?[a-z0-9]+)*$/.test(c.params.username)) return { error: 5, message: 'Invalid username. Username must be 3-16 characters long, can contain only English alphabet letters, numbers, and special characters (_ . -), but not at the beginning, end, or two in a row' };
  if (c.params.password.length < 8) return { error: 6, message: 'Password has to be 8 or more characters long' };
  await this.data.adminAdminsAdd(c.params.username, c.params.password);
  return { error: 0, data: { message: 'Admin was created successfully' } };
 }

 async adminAdminsEdit(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.adminID) return { error: 2, message: 'Admin ID is missing' };
  if (!(await this.data.adminExistsByID(c.params.adminID))) return { error: 3, message: 'Wrong admin ID' };
  if (!c.params.username && !c.params.password) return { error: 4, message: 'Admin username or admin password has to be in parameters' };
  // TODO: check if another admin with the same username, but with a different user ID already exists, the following doesn't count with different user ID:
  //if (await this.data.adminExistsByUsername(c.params.username)) return { error: 5, message: 'This admin already exists' };
  await this.data.adminAdminsEdit(c.params.adminID, c.params.username, c.params.password);
  return { error: 0, message: 'Admin was edited successfully' };
 }

 async adminAdminsDel(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.adminID) return { error: 2, message: 'Admin ID is missing' };
  if (!(await this.data.adminExistsByID(c.params.adminID))) return { error: 3, message: 'Wrong admin ID' };
  await this.data.adminAdminsDel(c.params.adminID);
  return { error: 0, message: 'Admin was deleted successfully' };
 }

 async adminAdminsInfo(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.adminID) return { error: 2, message: 'Admin ID is missing' };
  const res = await this.data.getAdminInfoByID(c.params.adminID);
  if (!res) return { error: 3, message: 'Wrong admin ID' };
  return { error: 0, data: res };
 }

 async adminDomainsList(c) {
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
  return { error: 0, data: { domains: await this.data.adminDomainsList(c.params?.count, c.params?.offset, orderBy, direction, c.params?.filterName) } };
 }

 async adminDomainsAdd(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.name) return { error: 2, message: 'Domain name is missing' };
  c.params.name = c.params.name.toLowerCase();
  if (await this.data.domainExistsByName(c.params.name)) return { error: 3, message: 'This domain already exists' };
  await this.data.adminDomainsAdd(c.params.name);
  return { error: 0, data: { message: 'Domain was created successfully' } };
 }

 async adminDomainsEdit(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.domainID) return { error: 2, message: 'Domain ID is missing' };
  if (!(await this.data.domainExistsByID(c.params.domainID))) return { error: 3, message: 'Wrong domain ID' };
  if (!c.params.name) return { error: 4, message: 'Domain name is missing' };
  await this.data.adminDomainsEdit(c.params.domainID, c.params.name);
  return { error: 0, message: 'Domain was edited successfully' };
 }

 async adminDomainsDel(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.domainID) return { error: 2, message: 'Domain ID is missing' };
  if (!(await this.data.domainExistsByID(c.params.domainID))) return { error: 3, message: 'Wrong domain ID' };
  if ((await this.data.adminUsersCount(c.params.domainID)) > 0) return { error: 4, message: 'Cannot delete this domain, as it still has some users' };
  await this.data.adminDomainsDel(c.params.domainID);
  return { error: 0, message: 'Domain was deleted successfully' };
 }

 async adminDomainsInfo(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.domainID) return { error: 2, message: 'Domain ID is missing' };
  const res = await this.data.getDomainInfoByID(c.params.domainID);
  if (!res) return { error: 3, message: 'Wrong domain ID' };
  return { error: 0, data: res };
 }

 async adminUsersList(c) {
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
  return { error: 0, data: { users: await this.data.adminUsersList(c.params?.count, c.params?.offset, orderBy, direction, c.params?.filterUsername, c.params?.filterDomainID) } };
 }

 async adminUsersAdd(c) {
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
  await this.data.adminUsersAdd(c.params.username, c.params.domainID, c.params.visible_name, c.params.password);

  // TRANSACTION END

  return { error: 0, message: 'User was added successfully' };
 }

 async adminUsersEdit(c) {
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
  await this.data.adminUsersEdit(c.params.userID, c.params.username, c.params.domainID, c.params.visible_name, c.params.password);

  // TRANSACTION END

  return { error: 0, message: 'User was edited successfully' };
 }

 async adminUsersDel(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.userID) return { error: 2, message: 'User ID is missing' };
  if (!(await this.data.userExistsByID(c.params.userID))) return { error: 3, message: 'Wrong user ID' };
  await this.data.adminUsersDel(c.params.userID);
  return { error: 0, message: 'User was deleted successfully' };
 }

 async adminUsersInfo(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.userID) return { error: 2, message: 'User ID is missing' };
  const res = await this.data.getUserInfoByID(c.params.userID);
  if (!res) return { error: 3, message: 'Wrong user ID' };
  return { error: 0, data: res };
 }

 async adminModulesList(c) {
  let orderBy = 'id';
  if (c.params?.orderBy) {
   const validOrderBy = ['id', 'name', 'connection_string', 'created'];
   orderBy = c.params.orderBy.toLowerCase();
   if (!validOrderBy.includes(orderBy)) return { error: 1, message: 'Invalid column name in orderBy parameter' };
  }
  let direction = 'ASC';
  if (c.params?.direction) {
   const validDirection = ['ASC', 'DESC'];
   direction = c.params.direction.toUpperCase();
   if (!validDirection.includes(direction)) return { error: 2, message: 'Invalid direction in direction parameter' };
  }
  return { error: 0, data: { modules: await this.data.adminModulesList(c.params?.count, c.params?.offset, orderBy, direction, c.params?.filterName) } };
 }

 async adminModulesAdd(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.name) return { error: 2, message: 'Module name is missing' };
  c.params.name = c.params.name.toLowerCase();
  if (await this.data.moduleExistsByName(c.params.name)) return { error: 3, message: 'This module already exists' };
  if (!c.params.connection_string) return { error: 4, message: 'Module connection string is missing' };
  c.params.connection_string = c.params.connection_string.toLowerCase();
  await this.data.adminModulesAdd(c.params.name, c.params.connection_string);
  return { error: 0, data: { message: 'Module was created successfully' } };
 }

 async adminModulesEdit(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.moduleID) return { error: 2, message: 'Module ID is missing' };
  if (!(await this.data.moduleExistsByID(c.params.moduleID))) return { error: 3, message: 'Wrong module ID' };
  if (!c.params.name) return { error: 4, message: 'Module name is missing' };
  if (!c.params.connection_string) return { error: 5, message: 'Connection string is missing' };
  await this.data.adminModulesEdit(c.params.moduleID, c.params.name, c.params.connection_string);
  return { error: 0, message: 'Module was edited successfully' };
 }

 async adminModulesDel(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.moduleID) return { error: 2, message: 'Module ID is missing' };
  if (!(await this.data.moduleExistsByID(c.params.moduleID))) return { error: 3, message: 'Wrong module ID' };
  await this.data.adminModulesDel(c.params.moduleID);
  return { error: 0, message: 'Module was deleted successfully' };
 }

 async adminModulesInfo(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.moduleID) return { error: 2, message: 'Module ID is missing' };
  const res = await this.data.getModuleInfoByID(c.params.moduleID);
  if (!res) return { error: 3, message: 'Wrong module ID' };
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
     name: Info.appName,
     version: Info.appVersion
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
  const res = await this.data.userSessionsList(c.userID, c.params?.count, c.params?.offset);
  if (!res) return { error: 1, message: 'No sessions found for this user' };
  return { error: 0, data: { sessions: res } };
 }

 async userDelSession(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.sessionID) return { error: 2, message: 'Session ID to be deleted not set' };
  if (!(await this.data.userSessionExists(c.userID, c.params.sessionID))) return { error: 3, message: 'Session ID to be deleted not found for this user' };
  await this.data.userSessionsDel(c.userID, c.sessionID);
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

 userSubscribe(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.event) return { error: 2, message: 'Event parameter is missing' };
  if (!this.allowedEvents.includes(c.params.event)) return { error: 3, message: 'Unsupported event name' };
  const clientData = this.webServer.wsClients.get(c.ws);
  if (!clientData) return { error: 4, message: 'Client not found' };
  clientData.userID = c.userID;
  clientData.subscriptions.add(c.params.event);
  Log.info('Client ' + c.ws.remoteAddress + ' subscribed to event: ' + c.params.event);
  return { error: 0, message: 'Event subscribed' };
 }

 notifySubscriber(userID, event, data) {
  const clients = this.webServer.wsClients;
  for (const [ws, clientData] of clients) {
   if (clientData.userID === userID && clientData.subscriptions.has(event)) {
    const res = JSON.stringify({ event, data });
    Log.info('WebSocket event to: ' + ws.remoteAddress + ', message: ' + res);
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

 userHeartbeat(c) {
  Log.info('Heartbeat from: ' + c.ws.remoteAddress);
  return { error: 0, message: 'Heartbeat received' };
 }

 getUUID() {
  return crypto.randomUUID();
 }

 isValidJSON(text) {
  try {
   JSON.parse(text);
   return true;
  } catch (e) {
   return false;
  }
 }
}

export default API;
