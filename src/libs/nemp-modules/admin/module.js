const NempModule = require('../../module');
const Response = require('../../response');
const Data = require('./data');

class Admin extends NempModule {
  constructor(db) {
    super();
    this.data = new Data(db);
    this.commandPrefix = 'admin_';
    this.commands = {
      admin_get_admins: this.getAdmins(),
    };
  }

  async getAdmins() {
    const data = await this.data.adminGetAdmins();
    return Response.sendData(this.getCommandName(), data);
  }
}

module.exports = Admin;
