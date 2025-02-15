import os from 'os';
import Data from './data.js';
//import DNS from './dns.js';
import { Info } from './info.js';
import { newLogger, Signals } from 'yellow-server-common';

let Log = newLogger('api');
let authLog = newLogger('auth');

class API {
 constructor(webServer, modules) {
  this.webServer = webServer;
  this.modules = modules;
  this.signals = new Signals(['new_user'], this.webServer.clients, (_wsGuid, clientData, msg) => clientData.ws?.send(JSON.stringify({ ...msg, type: 'notify' })));
  this.data = new Data();
  //this.dns = new DNS();
  this.allowedEvents = [];
  setInterval(async () => {
   const resAdmin = await this.data.adminDelOldSessions();
   const resUser = await this.data.userDelOldSessions();
   if (resAdmin.changes || resUser.changes) Log.info('Expired sessions cleaner: ' + (resAdmin.changes || 0) + ' admin sessions and ' + (resUser.changes || 0) + ' user sessions deleted.');
  }, Info.settings.session.cleaner * 1000);
  this.commands = {
   admin_login: { method: this.adminLogin },
   admin_sessions_list: { method: this.adminSessionsList, reqAdminSession: true },
   admin_sessions_del: { method: this.adminSessionsDel, reqAdminSession: true },
   admin_sessions_del_name: { method: this.adminSessionsDelName, reqAdminSession: true },
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
   admin_clients_list: { method: this.adminClientsList, reqAdminSession: true },
   admin_clients_kick: { method: this.adminClientsKick, reqAdminSession: true },
   admin_clients_kick_by_ip: { method: this.adminClientsKickByIp, reqAdminSession: true },
   user_login: { method: this.userLogin },
   user_sessions_list: { method: this.userListSessions, reqUserSession: true },
   user_session_del: { method: this.userDelSession, reqUserSession: true },
   user_userinfo_get: { method: this.userGetUserInfo, reqUserSession: true },
   user_subscribe: { method: this.signals.subscribe.bind(this.signals), reqUserSession: true },
   user_unsubscribe: { method: this.signals.unsubscribe.bind(this.signals), reqUserSession: true },
   ping: { method: this.userPing },
  };
 }

 async authenticateUser(req, resp, context) {
  if (!req.sessionID) return { ...resp, error: 996, message: 'User session is missing' };
  if (!(await this.data.userCheckSession(req.sessionID)))
   return {
    ...resp,
    error: 998,
    message: 'Invalid user session ID',
   };
  if (await this.data.userSessionExpired(req.sessionID))
   return {
    ...resp,
    error: 994,
    message: 'User session is expired',
   };
  await this.data.userUpdateSessionTime(req.sessionID);
  const userID = await this.data.getUserIDBySession(req.sessionID);
  context.userAddress = await this.data.getUserAddressByID(userID);
  if (userID) context.userID = userID;
  return true;
 }

 async processAPI(corr, ws, wsGuid, json) {
  Log.trace(corr, 'API request:', json);
  let req;
  try {
   req = JSON.parse(json);
  } catch (ex) {
   return { error: 902, message: 'Invalid JSON command' };
  }

  let resp = {};
  if (req.requestID) resp.requestID = req.requestID;

  const context = { ws, requestID: req.requestID, wsGuid };

  const target = req.target || 'core';
  const command_name = req.command || req.data?.command;

  if (target === 'core') return await this.coreCmd(corr, command_name, resp, req, context);
  else return await this.moduleCmd(corr, wsGuid, target, command_name, req, resp);
 }

 async coreCmd(corr, command_name, resp, req, context) {
  if (!command_name) return { ...resp, error: 999, message: 'Command not set' };
  const command_fn = this.commands[command_name];
  if (!command_fn) return { ...resp, error: 903, message: 'Unknown command' };
  if (command_fn.reqAdminSession) {
   if (!req.sessionID) return { ...resp, error: 995, message: 'Admin session is missing' };
   if (!(await this.data.adminSessionCheck(req.sessionID))) return { ...resp, error: 997, message: 'Invalid admin session ID' };
   if (await this.data.adminSessionExpired(req.sessionID)) return { ...resp, error: 994, message: 'Admin session is expired' };
   await this.data.adminUpdateSessionTime(req.sessionID);
   const adminID = await this.data.getAdminIDBySession(req.sessionID);
   if (adminID) context.adminID = adminID;
  } else if (command_fn.reqUserSession) {
   const auth_result = await this.authenticateUser(req, resp, /*ref*/ context);
   if (auth_result !== true) return auth_result;
  }
  if (req.sessionID) context.sessionID = req.sessionID;
  if (req.data?.params) context.params = req.data.params;
  //Log.debug('coreCmd:');
  //Log.debug('req:', req);
  //Log.debug('command_fn:', command_fn);
  //Log.debug('context:', context);
  Log.debug(corr, 'Executing core command:', command_name);
  let method_result = await command_fn.method.call(this, context);
  return { ...resp, ...method_result };
 }

 async moduleCmd(corr, wsGuid, target, command_name, req, resp) {
  let msg = {
   data: req.data,
   sessionID: req.sessionID,
   requestID: req.requestID,
   wsGuid: wsGuid,
  };
  authLog.debug(corr, 'authenticating user for module command:', target, command_name);
  const auth_result = await this.authenticateUser(req, resp, msg);
  if (auth_result !== true) {
   authLog.warning(corr, 'User authentication failed for module command:', target, command_name);
   return auth_result;
  }
  authLog.debug(corr, 'User authenticated for module command.');
  let r = await this.modules.sendUserCmdToModule(corr, target, msg, wsGuid, req.requestID);
  return { ...resp, ...r };
 }

 async adminLogin(c) {
  if (!c.params) return { error: 'PARAMETERS_MISSING', message: 'Parameters are missing' };
  if (!c.params.username) return { error: 'USERNAME_MISSING', message: 'Username is missing' };
  if (!c.params.password) return { error: 'PASSWORD_MISSING', message: 'Password is missing' };
  c.params.username = c.params.username.toLowerCase();
  const adminCredentials = await this.data.getAdminCredentials(c.params.username);
  if (!adminCredentials) return { error: 'WRONG_USERNAME', message: 'Wrong username' };
  authLog.debug('adminCredentials:', adminCredentials);
  authLog.debug('c.params:', c.params);
  authLog.debug('c.params.password:', c.params.password);
  if (!this.data.verifyHash(adminCredentials.password, c.params.password)) return { error: 'WRONG_PASSWORD', message: 'Wrong password' };
  const sessionID = this.getUUID();
  await this.data.adminSetLogin(adminCredentials.id, sessionID);
  return { error: false, data: { sessionID } };
 }

 async adminSessionsList(c) {
  let orderBy = 'id';
  if (c.params?.orderBy) {
   const validOrderBy = ['id', 'session', 'last', 'created'];
   orderBy = c.params.orderBy.toLowerCase();
   if (!validOrderBy.includes(orderBy)) return { error: 'INVALID_ORDER_COLUMN', message: 'Invalid column name in orderBy parameter' };
  }
  let direction = 'ASC';
  if (c.params?.direction) {
   const validDirection = ['ASC', 'DESC'];
   direction = c.params.direction.toUpperCase();
   if (!validDirection.includes(direction)) return { error: 'INVALID_DIRECTION', message: 'Invalid direction in direction parameter' };
  }
  return { error: false, data: { sessions: await this.data.adminSessionsList(c.adminID, c.params?.count, c.params?.offset, orderBy, direction, c.params?.filterName) } };
 }

 async adminSessionsDel(c) {
  if (!c.params) return { error: 'PARAMETERS_MISSING', message: 'Parameters are missing' };
  if (!c.params.sessionID) return { error: 'SESSION_ID_MISSING', message: 'Session ID to be deleted not set' };
  if (!(await this.data.adminSessionExists(c.adminID, c.params.sessionID))) return { error: 'SESSION_ID_NOT_FOUND', message: 'Session ID to be deleted not found for this admin' };
  await this.data.adminSessionsDel(c.adminID, c.params.sessionID);
  return { error: false, message: 'Session was deleted' };
 }

 async adminSessionsDelName(c) {
  if (!c.params) return { error: 'PARAMETERS_MISSING', message: 'Parameters are missing' };
  if (!c.params.session_name) return { error: 'SESSION_NAME_MISSING', message: 'Session name to be deleted not set' };
  if (!(await this.data.adminSessionExistsName(c.adminID, c.params.session_name))) return { error: 'SESSION_NAME_NOT_FOUND', message: 'Session name to be deleted not found for this admin' };
  await this.data.adminSessionsDelName(c.adminID, c.params.session_name);
  return { error: false, message: 'Session was deleted' };
 }

 async adminAdminsList(c) {
  let orderBy = 'id';
  if (c.params?.orderBy) {
   const validOrderBy = ['id', 'username', 'created'];
   orderBy = c.params.orderBy.toLowerCase();
   if (!validOrderBy.includes(orderBy)) return { error: 'INVALID_ORDER_COLUMN_NAME', message: 'Invalid column name in orderBy parameter' };
  }
  let direction = 'ASC';
  if (c.params?.direction) {
   const validDirection = ['ASC', 'DESC'];
   direction = c.params.direction.toUpperCase();
   if (!validDirection.includes(direction)) return { error: 'INVALID_DIRECTION', message: 'Invalid direction in direction parameter' };
  }
  return {
   error: false,
   data: { admins: await this.data.adminAdminsList(c.params?.count, c.params?.offset, orderBy, direction, c.params?.filterName) },
  };
 }

 async adminAdminsAdd(c) {
  if (!c.params) return { error: 'PARAMETERS_MISSING', message: 'Parameters are missing' };
  if (!c.params.username) return { error: 'USERNAME_MISSING', message: 'Username is missing' };
  if (!c.params.password) return { error: 'PASSWORD_MISSING', message: 'Password is missing' };
  c.params.username = c.params.username.toLowerCase();
  if (await this.data.adminExistsByUsername(c.params.username)) return { error: 'USERNAME_EXISTS', message: 'This admin already exists' };
  const minChars = 3;
  const maxChars = 16;
  if (!this.usernameHasValidLength(c.params.username, minChars, maxChars) || !this.usernameHasValidCharacters(c.params.username)) return { error: 'INVALID_USERNAME', message: 'Invalid username. Username must be ' + minChars + ' - ' + maxChars + ' characters long, can contain only English alphabet letters, numbers, and special characters (_ . -), but not at the beginning, end, or two in a row' };
  if (c.params.password.length < 8) return { error: 'INVALID_PASSWORD_LENGTH', message: 'Password has to be 8 or more characters long' };
  await this.data.adminAdminsAdd(c.params.username, c.params.password);
  return { error: false, data: { message: 'Admin was created successfully' } };
 }

 async adminAdminsEdit(c) {
  if (!c.params) return { error: 'PARAMETERS_MISSING', message: 'Parameters are missing' };
  if (!c.params.adminID) return { error: 'USERNAME_MISSING', message: 'Admin ID is missing' };
  if (!(await this.data.adminExistsByID(c.params.adminID))) return { error: 'INVALID_ID', message: 'Wrong admin ID' };
  if (!c.params.username && !c.params.password) return { error: 'USERNAME_OR_PASSWORD_MISSING', message: 'Admin username or admin password has to be in parameters' };
  if (c.params.username) {
   c.params.username = c.params.username.toLowerCase();
   const minChars = 3;
   const maxChars = 16;
   if (!this.usernameHasValidLength(c.params.username, minChars, maxChars) || !this.usernameHasValidCharacters(c.params.username)) return { error: 'INVALID_USERNAME', message: 'Invalid username. Username must be ' + minChars + ' - ' + maxChars + ' characters long, can contain only English alphabet letters, numbers, and special characters (_ . -), but not at the beginning, end, or two in a row' };
  }
  // TODO: check if another admin with the same username, but with a different user ID already exists, the following doesn't count with different user ID:
  //if (await this.data.adminExistsByUsername(c.params.username)) return { error: 'USER_EXISTS', message: 'This admin already exists' };
  if (c.params.password && c.params.password.length < 8) return { error: 'INVALID_PASSWORD_LENGTH', message: 'Password has to be 8 or more characters long' };
  await this.data.adminAdminsEdit(c.params.adminID, c.params.username, c.params.password);
  return { error: false, message: 'Admin was edited successfully' };
 }

 async adminAdminsDel(c) {
  if (!c.params) return { error: 'PARAMETERS_MISSING', message: 'Parameters are missing' };
  if (!c.params.adminID) return { error: 'ID_MISSING', message: 'Admin ID is missing' };
  if (!(await this.data.adminExistsByID(c.params.adminID))) return { error: 'WRONG_ID', message: 'Wrong admin ID' };
  await this.data.adminAdminsDel(c.params.adminID);
  return { error: false, message: 'Admin was deleted successfully' };
 }

 async adminAdminsInfo(c) {
  if (!c.params) return { error: 'PARAMETERS_MISSING', message: 'Parameters are missing' };
  if (!c.params.adminID) return { error: 'ID_MISSING', message: 'Admin ID is missing' };
  const res = await this.data.getAdminInfoByID(c.params.adminID);
  if (!res) return { error: 'WRONG_ID', message: 'Wrong admin ID' };
  return { error: false, data: res };
 }

 async adminDomainsList(c) {
  let orderBy = 'id';
  if (c.params?.orderBy) {
   const validOrderBy = ['id', 'name', 'users_count', 'created'];
   orderBy = c.params.orderBy.toLowerCase();
   if (!validOrderBy.includes(orderBy)) return { error: 'INVALID_ORDER_COLUMN', message: 'Invalid column name in orderBy parameter' };
  }
  let direction = 'ASC';
  if (c.params?.direction) {
   const validDirection = ['ASC', 'DESC'];
   direction = c.params.direction.toUpperCase();
   if (!validDirection.includes(direction)) return { error: 'INVALID_DIRECTION', message: 'Invalid direction in direction parameter' };
  }
  return {
   error: false,
   data: { domains: await this.data.adminDomainsList(c.params?.count, c.params?.offset, orderBy, direction, c.params?.filterName) },
  };
 }

 async adminDomainsAdd(c) {
  if (!c.params) return { error: 'PARAMETERS_MISSING', message: 'Parameters are missing' };
  if (!c.params.name) return { error: 'DOMAIN_NAME_MISSING', message: 'Domain name is missing' };
  c.params.name = c.params.name.toLowerCase();
  if (await this.data.domainExistsByName(c.params.name)) return { error: 'DOMAIN_EXISTS', message: 'This domain already exists' };
  await this.data.adminDomainsAdd(c.params.name);
  return { error: false, data: { message: 'Domain was created successfully' } };
 }

 async adminDomainsEdit(c) {
  if (!c.params) return { error: 'PARAMETERS_MISSING', message: 'Parameters are missing' };
  if (!c.params.domainID) return { error: 'ID_MISSING', message: 'Domain ID is missing' };
  if (!(await this.data.domainExistsByID(c.params.domainID))) return { error: 'ID_WRONG', message: 'Wrong domain ID' };
  if (!c.params.name) return { error: 'DOMAIN_NAME_MISSING', message: 'Domain name is missing' };
  await this.data.adminDomainsEdit(c.params.domainID, c.params.name);
  return { error: false, message: 'Domain was edited successfully' };
 }

 async adminDomainsDel(c) {
  if (!c.params) return { error: 'PARAMETERS_MISSING', message: 'Parameters are missing' };
  if (!c.params.domainID) return { error: 'ID_MISSING', message: 'Domain ID is missing' };
  if (!(await this.data.domainExistsByID(c.params.domainID))) return { error: 'WRONG_ID', message: 'Wrong domain ID' };
  if ((await this.data.adminUsersCount(c.params.domainID)) > 0) return { error: 'DOMAIN_USED', message: 'Cannot delete this domain, as it still has some users' };
  await this.data.adminDomainsDel(c.params.domainID);
  return { error: false, message: 'Domain was deleted successfully' };
 }

 async adminDomainsInfo(c) {
  if (!c.params) return { error: 'PARAMETERS_MISSING', message: 'Parameters are missing' };
  if (!c.params.domainID) return { error: 'ID_MISSING', message: 'Domain ID is missing' };
  const res = await this.data.getDomainInfoByID(c.params.domainID);
  if (!res) return { error: 'WRONG_ID', message: 'Wrong domain ID' };
  return { error: false, data: res };
 }

 async adminUsersList(c) {
  let orderBy = 'id';
  if (c.params?.orderBy) {
   const validOrderBy = ['id', 'address', 'visible_name', 'created'];
   orderBy = c.params.orderBy.toLowerCase();
   if (!validOrderBy.includes(orderBy)) return { error: 'INVALID_ORDER_COLUMN', message: 'Invalid column name in orderBy parameter' };
  }
  let direction = 'ASC';
  if (c.params?.direction) {
   const validDirection = ['ASC', 'DESC'];
   direction = c.params.direction.toUpperCase();
   if (!validDirection.includes(direction)) return { error: 'INVALID_DIRECTION', message: 'Invalid direction in direction parameter' };
  }
  return { error: false, data: { users: await this.data.adminUsersList(c.params?.count, c.params?.offset, orderBy, direction, c.params?.filterUsername, c.params?.filterDomainID) } };
 }

 async adminUsersAdd(c) {
  if (!c.params) return { error: 'PARAMETERS_MISSING', message: 'Parameters are missing' };
  if (!c.params.username) return { error: 'USERNAME_MISSING', message: 'Username is missing' };
  if (!c.params.domainID) return { error: 'DOMAIN_ID_MISSING', message: 'Domain ID is missing' };
  if (!c.params.visible_name) return { error: 'VISIBLE_NAME_MISSING', message: 'Visible name is missing' };
  if (!c.params.password) return { error: 'PASSWORD_MISSING', message: 'Password is missing' };
  c.params.username = c.params.username.toLowerCase();
  const minChars = 1;
  const maxChars = 64;
  if (!this.usernameHasValidLength(c.params.username, minChars, maxChars) || !this.usernameHasValidCharacters(c.params.username)) return { error: 'INVALID_USERNAME', message: 'Invalid username. Username must be ' + minChars + ' - ' + maxChars + ' characters long, can contain only English alphabet letters, numbers, and special characters (_ . -), but not at the beginning, end, or two in a row' };
  // TRANSACTION BEGIN
  if (!(await this.data.domainExistsByID(c.params.domainID))) return { error: 'WRONG_DOMAIN_ID', message: 'Wrong domain ID' };
  if (await this.data.userExistsByUserNameAndDomain(c.params.username, c.params.domainID)) return { error: 'USER_EXISTS', message: 'User already exists' };
  if (c.params.password.length < 8) return { error: 'INVALID_PASSWORD_LENGTH', message: 'Password has to be 8 or more characters long' };
  await this.data.adminUsersAdd(c.params.username, c.params.domainID, c.params.visible_name, c.params.password);
  // TRANSACTION END
  this.signals.notify('new_user', { username: c.params.username, domainID: c.params.domainID });
  return { error: false, message: 'User was added successfully' };
 }

 async adminUsersEdit(c) {
  if (!c.params) return { error: 'PARAMETERS_MISSING', message: 'Parameters are missing' };
  if (!c.params.userID) return { error: 'ID_MISSING', message: 'User ID is missing' };
  if (!c.params.username && !c.params.domainID && !c.params.visible_name && !c.params.password)
   return {
    error: 'USERNAME_DOMAIN_VISIBLE_NAME_PASSWORD_MISSING',
    message: 'Username, domain ID, visible_name or password has to be in parameters',
   };
  c.params.username = c.params.username.toLowerCase();
  if (c.params.username) {
   const minChars = 1;
   const maxChars = 64;
   if (!this.usernameHasValidLength(c.params.username, minChars, maxChars) || !this.usernameHasValidCharacters(c.params.username)) return { error: 'INVALID_USERNAME', message: 'Invalid username. Username must be ' + minChars + '- ' + maxChars + ' characters long, can contain only English alphabet letters, numbers, and special characters (_ . -), but not at the beginning, end, or two in a row' };
  }
  // TRANSACTION BEGIN
  if (!(await this.data.userExistsByID(c.params.userID))) return { error: 'WRONG_USER_ID', message: 'Wrong user ID' };
  if (c.params.domainID) {
   if (!(await this.data.domainExistsByID(c.params.domainID))) return { error: 'WRONG_DOMAIN_ID', message: 'Wrong domain ID' };
  }
  if (await this.data.userExistsByUserNameAndDomain(c.params.username, c.params.domainID, c.params.userID))
   return {
    error: 'USER_EXISTS',
    message: 'User already exists',
   };
  if (c.params.password) {
   if (c.params.password.length < 8) return { error: 'INVALID_PASSWORD_LENGTH', message: 'Password has to be 8 or more characters long' };
  }
  await this.data.adminUsersEdit(c.params.userID, c.params.username, c.params.domainID, c.params.visible_name, c.params.password);
  // TRANSACTION END
  return { error: false, message: 'User was edited successfully' };
 }

 async adminUsersDel(c) {
  if (!c.params) return { error: 'PARAMETERS_MISSING', message: 'Parameters are missing' };
  if (!c.params.userID) return { error: 'ID_MISSING', message: 'User ID is missing' };
  if (!(await this.data.userExistsByID(c.params.userID))) return { error: 'WRONG_ID', message: 'Wrong user ID' };
  await this.data.adminUsersDel(c.params.userID);
  return { error: false, message: 'User was deleted successfully' };
 }

 async adminUsersInfo(c) {
  if (!c.params) return { error: 'PARAMETERS_MISSING', message: 'Parameters are missing' };
  if (!c.params.userID) return { error: 'ID_MISSING', message: 'User ID is missing' };
  const res = await this.data.getUserInfoByID(c.params.userID);
  if (!res) return { error: 'WRONG_ID', message: 'Wrong user ID' };
  return { error: false, data: res };
 }

 async adminModulesList(c) {
  let orderBy = 'id';
  if (c.params?.orderBy) {
   const validOrderBy = ['id', 'name', 'connection_string', 'created'];
   orderBy = c.params.orderBy.toLowerCase();
   if (!validOrderBy.includes(orderBy)) return { error: 'INVALID_ORDER_COLUMN', message: 'Invalid column name in orderBy parameter' };
  }
  let direction = 'ASC';
  if (c.params?.direction) {
   const validDirection = ['ASC', 'DESC'];
   direction = c.params.direction.toUpperCase();
   if (!validDirection.includes(direction)) return { error: 'INVALID_DIRECTION', message: 'Invalid direction in direction parameter' };
  }
  return {
   error: false,
   data: { modules: await this.data.adminModulesList(c.params?.count, c.params?.offset, orderBy, direction, c.params?.filterName) },
  };
 }

 async adminModulesAdd(c) {
  if (!c.params) return { error: 'PARAMETERS_MISSING', message: 'Parameters are missing' };
  if (!c.params.name) return { error: 'MODULE_NAME_MISSING', message: 'Module name is missing' };
  c.params.name = c.params.name.toLowerCase();
  if (await this.data.moduleExistsByName(c.params.name)) return { error: 'MODULE_EXISTS', message: 'This module already exists' };
  if (!c.params.connection_string) return { error: 'CONNECTION_STRING_MISSING', message: 'Module connection string is missing' };
  c.params.connection_string = c.params.connection_string.toLowerCase();
  await this.data.adminModulesAdd(c.params.name, c.params.connection_string);
  await this.modules.init_module(c.params.name);
  return { error: false, data: { message: 'Module was created successfully' } };
 }

 async adminModulesEdit(c) {
  if (!c.params) return { error: 'PARAMETERS_MISSING', message: 'Parameters are missing' };
  if (!c.params.moduleID) return { error: 'ID_MISSING', message: 'Module ID is missing' };
  if (!(await this.data.moduleExistsByID(c.params.moduleID))) return { error: 'WRONG_ID', message: 'Wrong module ID' };
  if (!c.params.name) return { error: 'NAME_MISSING', message: 'Module name is missing' };
  if (!c.params.connection_string) return { error: 'CONNECTION_STRING_MISSING', message: 'Connection string is missing' };
  await this.data.adminModulesEdit(c.params.moduleID, c.params.name, c.params.connection_string, c.params.enabled);
  await this.modules.reinit_module(c.params.moduleID, c.params.name, c.params.enabled);
  return { error: false, message: 'Module was edited successfully' };
 }

 async adminModulesDel(c) {
  if (!c.params) return { error: 'PARAMETERS_MISSING', message: 'Parameters are missing' };
  if (!c.params.moduleID) return { error: 'ID_MISSING', message: 'Module ID is missing' };
  if (!(await this.data.moduleExistsByID(c.params.moduleID))) return { error: 'WRONG_ID', message: 'Wrong module ID' };
  await this.data.adminModulesDel(c.params.moduleID);
  await this.modules.remove(c.params.moduleID);
  return { error: false, message: 'Module was deleted successfully' };
 }

 async adminModulesInfo(c) {
  if (!c.params) return { error: 'PARAMETERS_MISSING', message: 'Parameters are missing' };
  if (!c.params.moduleID) return { error: 'ID_MISSING', message: 'Module ID is missing' };
  const res = await this.data.getModuleInfoByID(c.params.moduleID);
  if (!res) return { error: 'WRONG_ID', message: 'Wrong module ID' };
  return { error: false, data: res };
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
   error: false,
   data: {
    app: {
     name: Info.appName,
     version: Info.appVersion,
    },
    os: {
     name: os.type(),
     version: os.release(),
    },
    cpu: {
     cpus: os.cpus().map(cpu => cpu.model),
     arch: os.arch(),
     load: Math.min(Math.floor((os.loadavg()[0] * 100) / os.cpus().length), 100),
    },
    ram: {
     total: os.totalmem(),
     free: os.freemem(),
    },
    hostname: os.hostname(),
    networks: os.networkInterfaces(),
    uptime: getUptime(os.uptime()),
   },
  };
 }

 async adminClientsList(c) {
  let items = [];
  this.webServer.clients.forEach((value, key) => {
   if (!c.params?.filterIp || c.params?.filterIp === value.ws.remoteAddress) {
    if (!c.params?.filterGuid || c.params?.filterGuid === key) {
     items.push({
      guid: key,
      ip: value.ws.remoteAddress,
     });
    }
   }
  });
  items = this.sortItems(items, c.params?.orderBy, c.params?.direction);
  items = items.slice(c.params.offset || 0, c.params.count || 10);
  return { error: false, data: { items } };
 }

 sortItems(items, orderBy, direction) {
  if (!orderBy) return items;
  if (orderBy === 'guid') {
   items.sort((a, b) => {
    if (direction === 'ASC') return a.guid.localeCompare(b.guid);
    else return b.guid.localeCompare(a.guid);
   });
  } else if (orderBy === 'ip') {
   items.sort((a, b) => {
    if (direction === 'ASC') return a.ip.localeCompare(b.ip);
    else return b.ip.localeCompare(a.ip);
   });
  }
  return items;
 }

 async adminClientsKick(c) {
  /*console.log(this.webServer.clients);
  console.log(c.params.guid);*/
  const client = this.webServer.clients.get(c.params.guid);
  client?.ws?.close();
 }

 async adminClientsKickByIp(c) {
  for (let client of this.webServer.clients) {
   console.log(client);
  }
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
  //console.log(userCredentials.password, c.params.password);
  if (!this.data.verifyHash(userCredentials.password, c.params.password)) return { error: 7, message: 'Wrong password' };
  const sessionID = this.getUUID();
  await this.data.userSetLogin(userCredentials.id, sessionID);
  return { error: 0, data: { sessionID, modules_available: this.modules.getAvailable() } };
 }

 async userListSessions(c) {
  const res = await this.data.userSessionsList(c.userID, c.params?.count, c.params?.offset);
  if (!res) return { error: 1, message: 'No sessions found for this user' };
  return { error: 0, data: { sessions: res } };
 }

 async userDelSession(c) {
  if (!c.params) return { error: 1, message: 'Parameters are missing' };
  if (!c.params.sessionID) return { error: 2, message: 'Session ID to be deleted not set' };
  if (!(await this.data.userSessionExists(c.userID, c.params.sessionID)))
   return {
    error: 3,
    message: 'Session ID to be deleted not found for this user',
   };
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

 usernameHasValidCharacters(username) {
  return !/^(?!.*[_.-]{2})[a-z0-9]+([_.-]?[a-z0-9]+)*$/.test(username);
 }

 usernameHasValidLength(username, min, max) {
  return username.length >= min && username.length <= max;
 }

 userPing(c) {
  //Log.debug('Ping from: ' + c.ws.remoteAddress);
  return { error: 0, message: 'Pong' };
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
