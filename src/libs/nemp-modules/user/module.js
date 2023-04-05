const NempModule = require('../../main-module/nemp-module');
const Response = require('../../response');
const UsersData = require('./data');

class Users extends NempModule {
  constructor() {
    super();
    this.moduleName = 'User';
    this.moduleVersion = '1.0.0';
    this.data = new UsersData();
    this.commands = {
      users_create_account: {
        auth: 'public',
        run: this.createAccount.bind(this),
      },
      users_login: {
        auth: 'public',
        run: this.userLogin.bind(this),
      },
      user_logout: {
        auth: 'user',
        run: this.userLogout.bind(this),
      },
    };

    this.logger.log(this.getModuleInfo());
  }

  async createAccount(command, data) {
    try {
      await this.data.usersCreateAccount(data);
      return Response.sendSuccess(command);
    } catch (error) {
      return Response.sendError(command, 'users_create_account_failed', error.message);
    }
  }

  async userLogin(command, data) {
    const { user, pass } = data;
    if (!user || !pass) {
      return Response.sendError(command, 'user_credentials_incomplete', 'Missing user or password data');
    }

    try {
      const response = await this.data.userLogin(user, pass);
      return Response.sendData(command, response);
    } catch (error) {
      return Response.sendError(command, 'user_login_failed', error.message);
    }
  }

  async userLogout(command, data) {
    const { token } = data;
    try {
      await this.data.userLogout(token);
      return Response.sendSuccess(command);
    } catch (error) {
      return Response.sendError(command, 'user_logout_failed', error.message);
    }
  }
}

module.exports = Users;
