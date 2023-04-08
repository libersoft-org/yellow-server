const Response = require('./response');
const ModulesLoader = require('./modules-loader');
// const DNS = require('./dns.js');

class NempModulesHandler {
  constructor() {
    this.modules = new ModulesLoader();
  }

  async command(commandData, ws) {
    try {
      const response = this.modules.callModuleCommand(commandData, ws);
      return response;
    } catch (error) {
      console.log(error);
      return Response.sendError(null, 'command_error', error.message);
    }
  }

  /*
    static readFileContents(filePath, startLine, endLine) {
    if (!filePath) return false;
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContents.split('\n');
    const startIndex = lines.findIndex((line) => line.includes(startLine));
    const endIndex = lines.findIndex((line) => line.includes(endLine));
    return lines.slice(startIndex + 1, endIndex).join('\n');
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
  */
}

module.exports = NempModulesHandler;
