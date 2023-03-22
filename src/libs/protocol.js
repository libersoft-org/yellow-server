const Data = require('./modules_data.js');
const Common = require('./common.js').Common;
const fs = require('fs');
//const DNS = require('./dns.js');

class Protocol {
 constructor() {
  const data = new Data();
  this.data = {
    core: data.core,
    identity: data['identity'],
    identity_protocol: data['identity-Protocol'],
    identity_protocol_path: data['identity-path']
  };
  //this.dns = new DNS();
 }
 async protocolHandler(data) {
   try {
    console.log({data});
    this.data.identity_protocol ? this.data.identity_protocol.protocolHandler(data) : null;
    var req = JSON.parse(data);
    var res = {}
    if (req.command) {
    if (req.command.startsWith('admin_')) res = await this.processAdminCommand(req);
    else if (req.command.startsWith('user_')) res = await this.processUserCommand(req);
    else res = { error: 'command_unknown', message: 'Command is unknown' }
    } else res = { error: 'command_missing', message: 'Command was not specified' }
    return JSON.stringify(res);
   } catch (error) {
      console.log(error);
      return JSON.stringify({ error: 'invalid_command', message: 'expected valid json', /*"error": error.message*/ });
   }
 }

 async processAdminCommand(req) {
    await this.data.core.adminDeleteOldTokens();
    if (req.command === 'admin_login') {
    if (req.user && req.pass) return { command: req.command, data: await this.data.core.adminGetLogin(req.user, req.pass) };
    else return { command: req.command, data: {logged: false, message: 'Missing user or password parameter'} }
    } else if (req.command === 'admin_logout') {
    if (await this.data.core.adminGetTokenExists(req.token)) await this.data.core.adminDeleteToken(req.token);
    return { command: req.command, data: { logged: false, message: 'Logged out' } }
    } else {
    if (await this.data.core.adminIsTokenValid(req.admin_token)) {
    await this.data.core.adminUpdateTokenTime(req.admin_token);
    // THIS WILL STAY HERE IN CORE:
    function readFileContents(filePath, startLine, endLine) {
      if(!filePath) return false;
      const fileContents = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContents.split('\n');
      const startIndex = lines.findIndex(line => line.includes(startLine));
      const endIndex = lines.findIndex(line => line.includes(endLine));
      return lines.slice(startIndex + 1, endIndex).join('\n');
    }
    if (req.command === 'admin_get_admins') return { command: req.command, data: await this.data.core.adminGetAdmins() };
    else if (req.command === 'admin_add_admin') return { command: req.command, data: await this.data.core.adminAddAdmin(req.name, req.pass) };
    else if (req.command === 'admin_set_admin') return { command: req.command, data: await this.data.core.adminSetAdmin(req.id, req.name) };
    else if (req.command === 'admin_del_admin') return { command: req.command, data: await this.data.core.adminDelAdmin(req.id) };
    else if (req.command === 'admin_sysinfo') return { command: req.command, data: this.getSysInfo() };
    //else if (req.command === 'admin_dns') return this.dns.getDomainInfo(domain);
    else if(readFileContents(this.data.identity_protocol_path, ' async processAdminCommand(req) {', ' }\nasync processUserCommand'));
    else return { error: 'command_unknown', message: 'Command unknown. Check that module exists' }
    } else return { error: 'admin_token_invalid', message: 'Invalid or expired admin login token' }
    }
 }

 async processUserCommand(req, res) {
  if (req.command === 'user_login') {
   if (req.user && req.pass) return await this.data.core.userGetLogin(req.user, req.pass);
   else return { command: req.command, logged: false, message: 'Missing user or password parameter' }
  } else if (req.command === 'user_logout') {
   if (await this.data.core.userGetTokenExists(req.token)) return { command: req.command, logged: false, message: 'Logged out' }
   else {
    if (await this.data.core.userIsTokenValid(req.user_token)) {
     // TODO: check if token is accessed from the same device
     // TODO: token expiration?
     if (req.command === 'user_get_contacts') return await this.data.core.userGetContacts();
     else if (req.command === 'user_add_contact') return await this.data.core.userAddContact(req.user_info);
     else if (req.command === 'user_set_contact') return await this.data.core.userSetContact(req.user_info);
     else if (req.command === 'user_del_contact') return await this.data.core.userDelContact(req.address);
     else if (req.command === 'user_del_contact') return await this.data.core.userDelContact(req.address);
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
  var updateTime = function(original_time) {
   const originalFormat = "20 days, 40 hours, 57 min";
   // Convert original format into a date object
   const date = new Date();
   date.setDate(parseInt(originalFormat.split(" ")[0]) + 1); // Add 1 day
   date.setHours(parseInt(originalFormat.split(", ")[1]) - 24); // Subtract 24 hours
   date.setMinutes(parseInt(originalFormat.split(", ")[2])); // Keep minutes the same
   // Format resulting date object into desired output format: "21 days, 16 hours, 57 min"
   const outputFormat = `${date.getDate()} days, ${date.getHours()} hours, ${date.getMinutes()} minutes, ` + secs + ' seconds';
   return outputFormat;
  }
  var uptime = updateTime(days + ' days, ' + hours + ' hours, ' + mins + ' minutes, ' + secs + ' seconds');
  var total_memory = os.totalmem(), free_memory = os.freemem();
  var total_mem_in_kb = total_memory/1024, free_mem_in_kb = free_memory/1024;
  var total_mem_in_mb = total_mem_in_kb/1024, free_mem_in_mb = free_mem_in_kb/1024;
  var total_mem_in_gb = total_mem_in_mb/1024, free_mem_in_gb = free_mem_in_mb/1024;
  return {
   app_name: Common.appName,
   app_version: Common.appVersion,
   os_name: os.type(),
   os_version: os.release(),
   cpu_model: os.cpus()[0].model,
   cpu_cores: os.cpus().length,
   cpu_arch: os.arch(),
   cpu_load: Math.min(Math.floor(os.loadavg()[0] * 100 / os.cpus().length), 100),
   ram_total: total_mem_in_gb,
   ram_free: free_mem_in_gb,
   hostname: os.hostname(),
   // networks: JSON.stringify(networks),
   networks: networks,
   uptime: uptime
  }
 }
}

module.exports = Protocol;