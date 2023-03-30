const NempModule = require('../../module/nemp-module');
const Response = require('../../response');
const AdminData = require('./data');

class Admin extends NempModule {
  constructor() {
    super();
    this.moduleName = 'Admin';
    this.moduleVersion = '1.0.0';
    this.data = new AdminData();
    this.commandPrefix = 'admin_';
    this.commands = {
      admin_get_admins: this.getAdmins.bind(this),
    };
  }

  runCommand(command, data = {}) {
    if (this.commands[command]) {
      return this.commands[command](command, data);
    }

    return Response.sendError(command, 'command_not_found', `[${this.moduleName}] Command not found`);
  }

  async getAdmins(command) {
    const data = await this.data.adminGetAdmins();
    return Response.sendData(command, data);
  }
}

module.exports = Admin;
