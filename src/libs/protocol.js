const Data = require('./data.js');
const Common = require('./common.js').Common;
//const DNS = require('./dns.js');

class Protocol {
 constructor() {
  this.data = new Data();
  //this.dns = new DNS();
 }

 async protocolHandler(data) {
   try {
    console.log(data);
    var req = JSON.parse(data);
    var res = {}
    if (req.command) {
    if (req.command.startsWith('admin_')) res = await this.processAdminCommand(req);
    else if (req.command.startsWith('user_')) res = await this.processUserCommand(req);
    else res = { error: 'command_unknown', message: 'Command is unknown' }
    } else res = { error: 'command_missing', message: 'Command was not specified' }
    return JSON.stringify(res);
   } catch (error) {
      return JSON.stringify({ error: 'invalid command', message: 'expected valid json', "error": error.message })
   }
 }

 async processAdminCommand(req) {
    await this.data.adminDeleteOldTokens();
    if (req.command == 'admin_login') {
    if (req.user && req.pass) return { command: req.command, data: await this.data.adminGetLogin(req.user, req.pass) };
    else return { command: req.command, logged: false, message: 'Missing user or password parameter' }
    } else if (req.command == 'admin_logout') {
    if (await this.data.adminGetTokenExists(req.token)) await this.data.adminDeleteToken(req.token);
    return { command: req.command, data: { logged: false, message: 'Logged out' } }
    } else {
    if (await this.data.adminIsTokenValid(req.admin_token)) {
    await this.data.adminUpdateTokenTime(req.admin_token);
    if (req.command == 'admin_get_domains') return { command: req.command, data: await this.data.adminGetDomains() };
    else if (req.command == 'admin_add_domain') return { command: req.command, data: await this.data.adminAddDomain(req.name) };
    else if (req.command == 'admin_set_domain') return { command: req.command, data: await this.data.adminSetDomain(req.id, req.name) };
    else if (req.command == 'admin_del_domain') return { command: req.command, data: await this.data.adminDelDomains(req.id) };
    else if (req.command == 'admin_get_users') return { command: req.command, data: await this.data.adminGetUsers(req.domain_id) };
    else if (req.command == 'admin_add_user') return { command: req.command, data: await this.data.adminAddUser(req.domain_id, req.name, req.visible_name, req.password) };
    else if (req.command == 'admin_set_user') return { command: req.command, data: await this.data.adminSetUser(req.id, req.domain_id, req.name, req.visible_name, req.photo, req.password) };
    else if (req.command == 'admin_del_user') return { command: req.command, data: await this.data.adminDelUser(req.id) };
    else if (req.command == 'admin_get_aliases') return { command: req.command, data: await this.data.adminGetAliases(req.domain_id) };
    else if (req.command == 'admin_add_aliases') return { command: req.command, data: await this.data.adminAddAlias(req.domain_id, req.alias, req.mail) };
    else if (req.command == 'admin_set_aliases') return { command: req.command, data: await this.data.adminSetAlias(req.id, req.alias, req.mail) };
    else if (req.command == 'admin_del_aliases') return { command: req.command, data: await this.data.adminDelAlias(req.id) };
    else if (req.command == 'admin_get_admins') return { command: req.command, data: await this.data.adminGetAdmins() };
    else if (req.command == 'admin_add_admin') return { command: req.command, data: await this.data.adminAddAdmin(req.name, req.pass) };
    else if (req.command == 'admin_set_admin') return { command: req.command, data: await this.data.adminSetAdmin(req.id, req.name) };
    else if (req.command == 'admin_del_admin') return { command: req.command, data: await this.data.adminDelAdmin(req.id) };
    else if (req.command == 'admin_sysinfo') return { command: req.command, data: this.getSysInfo() };
    //else if (req.command == 'admin_dns') return this.dns.getDomainInfo(domain);
    else return { error: 'command_unknown', message: 'Command is unknown' }
    } else return { error: 'admin_token_invalid', message: 'Invalid or expired admin login token' }
    }
 }

 async processUserCommand(req, res) {
  if (req.command == 'user_login') {
   if (req.user && req.pass) return await this.data.userGetLogin(req.user, req.pass);
   else return { command: req.command, logged: false, message: 'Missing user or password parameter' }
  } else if (req.command == 'user_logout') {
   if (await this.data.userGetTokenExists(req.token)) return { command: req.command, logged: false, message: 'Logged out' }
   else {
    if (await this.data.userIsTokenValid(req.user_token)) {
     // TODO: check if token is accessed from the same device
     // TODO: token expiration?
     if (req.command == 'user_get_contacts') return await this.data.userGetContacts();
     else if (req.command == 'user_add_contact') return await this.data.userAddContact(req.user_info);
     else if (req.command == 'user_set_contact') return await this.data.userSetContact(req.user_info);
     else if (req.command == 'user_del_contact') return await this.data.userDelContact(req.address);
     else if (req.command == 'user_del_contact') return await this.data.userDelContact(req.address);
     return { error: 'command_unknown', message: 'Command is unknown' } 
    } else return { error: 'user_token_invalid', message: 'Command is unknown' }
   }
  }
 }

 getSysInfo() {
  const os = require('os');
  var networks = [];
  var net = os.networkInterfaces();
  for (var iface in net) {
   var ifc = {}
   if (iface != 'lo') {
    var addresses = [];
    for (var i = 0; i < net[iface].length; i++) addresses.push(net[iface][i].address);
    ifc[iface] = addresses;
    networks.push(ifc);
   }
  }
  var secs = Math.floor(os.uptime());
  var mins = Math.floor(secs / 60);
  var hours = Math.floor(mins / 60);
  var days = Math.floor(hours / 24);
  days = days % 24;
  hours = hours % 60;
  mins = mins % 60;
  secs = secs % 60;
  var uptime = days + ' days, ' + hours + ' hours, ' + mins + ' minutes, ' + secs + ' seconds';
  return {
   app_name: Common.appName,
   app_version: Common.appVersion,
   os_name: os.type(),
   os_version: os.release(),
   cpu_model: os.cpus()[0].model,
   cpu_cores: os.cpus().length,
   cpu_arch: os.arch(),
   cpu_load: Math.min(Math.floor(os.loadavg()[0] * 100 / os.cpus().length), 100),
   ram_total: os.totalmem(),
   ram_free: os.freemem(),
   hostname: os.hostname(),
   networks: networks,
   uptime: uptime
  }
 }
}

module.exports = Protocol;
