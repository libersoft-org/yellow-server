const fs = require('fs');
const os = require('os');
const Data = require('./modules_data');
const { Common } = require('./common');
const Response = require('./response');
const ModulesLoader = require('./modules-loader');
// const DNS = require('./dns.js');

class Protocol {
  constructor() {
    const data = new Data();
    this.data = {
      core: data.core,
      identity: data.identity,
      identity_protocol: data['identity-Protocol'],
      identity_protocol_path: data['identity-path'],
    };
    this.modules = new ModulesLoader();
    // this.dns = new DNS();
  }

  static readFileContents(filePath, startLine, endLine) {
    if (!filePath) return false;
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContents.split('\n');
    const startIndex = lines.findIndex((line) => line.includes(startLine));
    const endIndex = lines.findIndex((line) => line.includes(endLine));
    return lines.slice(startIndex + 1, endIndex).join('\n');
  }

  async protocolHandler(commandData) {
    try {
      const response = this.modules.callModuleCommand(commandData);
      return response;
    } catch (error) {
      console.log(error);
      return Response.sendError(null, 'command_error', error.message);
    }
  }

  async commandAdminLogin(reqData) {
    const { user, pass, command } = reqData;

    if (!user || !pass) {
      return Response.sendError(command, 'admin_credentials_incomplete', 'Missing user or password data');
    }

    const data = await this.data.core.adminGetLogin(user, pass);
    return Response.sendData(command, data);
  }

  async processAdminCommand(reqData) {
    const { command, token } = reqData;
    await this.data.core.adminDeleteOldTokens();

    if (command === 'admin_login') {
      return this.commandAdminLogin(reqData);
    }

    if (!token) {
      return Response.sendError(command, 'admin_token_missing', 'Admin login token not found');
    }

    const validAdminToken = await this.data.core.adminGetTokenExists(token);
    if (!validAdminToken) {
      return Response.sendError(command, 'admin_token_invalid', 'Invalid or expired admin login token');
    }

    await this.data.core.adminUpdateTokenTime(token);

    switch (command) {
      case 'admin_logout':
        await this.data.core.adminDeleteToken(reqData.token);
        return Response.sendSuccess(command);
      case 'admin_get_admins': {
        // ONLY FOR TESTING MODULES LOADER //
        // const data = await this.data.core.adminGetAdmins();
        // return Response.sendData(command, data);
        const adminModule = this.modules.getModuleInstance('Admin');
        return adminModule.runCommand(command);
      }
      case 'admin_add_admin': {
        const data = await this.data.core.adminAddAdmin(reqData.name, reqData.pass);
        return Response.sendData(command, data);
      }
      case 'admin_set_admin': {
        const data = await this.data.core.adminSetAdmin(reqData.id, reqData.name);
        return Response.sendData(command, data);
      }
      case 'admin_del_admin': {
        const data = await this.data.core.adminDelAdmin(reqData.id);
        return Response.sendData(command, data);
      }
      case 'admin_sysinfo': {
        const data = Protocol.getSysInfo();
        return Response.sendData(command, data);
      }
      // case 'admin_dns':
      //  return this.dns.getDomainInfo(domain);
      default:
        return Response.sendError(command, 'command_unknown', 'Command unknown, please check available admin commands.');
    }
  }

  async processUserCommand(req, res) {
    if (req.command === 'user_login') {
      if (req.user && req.pass) return await this.data.core.userGetLogin(req.user, req.pass);
      return { command: req.command, logged: false, message: 'Missing user or password parameter' };
    } if (req.command === 'user_logout') {
      if (await this.data.core.userGetTokenExists(req.token)) return { command: req.command, logged: false, message: 'Logged out' };

      if (await this.data.core.userIsTokenValid(req.user_token)) {
        // TODO: check if token is accessed from the same device
        // TODO: token expiration?
        if (req.command === 'user_get_contacts') return await this.data.core.userGetContacts();
        if (req.command === 'user_add_contact') return await this.data.core.userAddContact(req.user_info);
        if (req.command === 'user_set_contact') return await this.data.core.userSetContact(req.user_info);
        if (req.command === 'user_del_contact') return await this.data.core.userDelContact(req.address);
        if (req.command === 'user_del_contact') return await this.data.core.userDelContact(req.address);
        return { error: 'command_unknown', message: 'Command is unknown' };
      } return { error: 'user_token_invalid', message: 'Command is unknown' };
    }
  }

  static getSysInfo() {
    const networks = [];
    const net = os.networkInterfaces();
    for (const iface in net) {
      const ifc = {};
      if (iface != 'lo') {
        const addresses = [];
        for (let i = 0; i < net[iface].length; i++) addresses.push(net[iface][i].address);
        ifc[iface] = addresses;
        networks.push(ifc);
      }
    }
    let secs = Math.floor(os.uptime());
    let mins = Math.floor(secs / 60);
    let hours = Math.floor(mins / 60);
    let days = Math.floor(hours / 24);
    days %= 24;
    hours %= 60;
    mins %= 60;
    secs %= 60;
    const updateTime = function (original_time) {
      const originalFormat = '20 days, 40 hours, 57 min';
      // Convert original format into a date object
      const date = new Date();
      date.setDate(parseInt(originalFormat.split(' ')[0]) + 1); // Add 1 day
      date.setHours(parseInt(originalFormat.split(', ')[1]) - 24); // Subtract 24 hours
      date.setMinutes(parseInt(originalFormat.split(', ')[2])); // Keep minutes the same
      // Format resulting date object into desired output format: "21 days, 16 hours, 57 min"
      const outputFormat = `${date.getDate()} days, ${date.getHours()} hours, ${date.getMinutes()} minutes, ${secs} seconds`;
      return outputFormat;
    };
    const uptime = updateTime(`${days} days, ${hours} hours, ${mins} minutes, ${secs} seconds`);
    const total_memory = os.totalmem(); const
      free_memory = os.freemem();
    const total_mem_in_kb = total_memory / 1024; const
      free_mem_in_kb = free_memory / 1024;
    const total_mem_in_mb = total_mem_in_kb / 1024; const
      free_mem_in_mb = free_mem_in_kb / 1024;
    const total_mem_in_gb = total_mem_in_mb / 1024; const
      free_mem_in_gb = free_mem_in_mb / 1024;
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
      networks,
      uptime,
    };
  }
}

module.exports = Protocol;
