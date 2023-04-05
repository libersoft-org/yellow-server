/* eslint-disable max-len */
const NempModule = require('../../main-module/nemp-module');
const Response = require('../../response');
const AdminData = require('./data');

class Admin extends NempModule {
  constructor() {
    super();
    this.moduleName = 'Admin';
    this.moduleVersion = '1.0.0';
    this.data = new AdminData();
    this.commands = {
      admin_login: {
        auth: 'public',
        run: this.adminLogin.bind(this),
      },
      admin_logout: {
        auth: 'admin',
        run: this.adminLogout.bind(this),
      },
      admin_get_admins: {
        auth: 'admin',
        run: this.getAdmins.bind(this),
      },
      admin_get_users: {
        auth: 'admin',
        run: this.getUsers.bind(this),
      },
      admin_del_user: {
        auth: 'admin',
        run: this.deleteUserAccount.bind(this),
      },
    };

    this.logger.log(this.getModuleInfo());
  }

  async adminLogin(command, data) {
    const { user, pass } = data;

    if (!user || !pass) {
      return Response.sendError(command, 'admin_credentials_incomplete', 'Missing user or password data');
    }

    try {
      const response = await this.data.adminLogin(user, pass);
      return Response.sendData(command, response);
    } catch (error) {
      return Response.sendError(command, 'admin_login_failed', error.message);
    }
  }

  async adminLogout(command, data) {
    const { token } = data;
    try {
      await this.data.adminLogout(token);
      return Response.sendSuccess(command);
    } catch (error) {
      return Response.sendError(command, 'admin_logout_failed', error.message);
    }
  }

  async getAdmins(command) {
    const data = await this.data.adminGetAdmins();
    return Response.sendData(command, data);
  }

  async getUsers(command) {
    const data = await this.data.adminGetUsers();
    return Response.sendData(command, data);
  }

  async deleteUserAccount(command, data) {
    const { userId } = data;
    try {
      await this.data.deleteUserAccount(userId);
      return Response.sendSuccess(command);
    } catch (error) {
      return Response.sendError(command, 'admin_delete_user', error.message);
    }
  }
}

module.exports = Admin;
