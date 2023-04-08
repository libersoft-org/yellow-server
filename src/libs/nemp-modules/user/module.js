const NempModule = require('../../main-module/nemp-module');
const Response = require('../../response');
const UsersData = require('./data');

class User extends NempModule {
  constructor(moduleToModule) {
    super();
    this.moduleToModule = moduleToModule;
    this.moduleName = 'User';
    this.moduleVersion = '1.0.0';
    this.data = new UsersData();
    this.commands = {
      user_create_account: {
        auth: 'public',
        run: this.createAccount.bind(this),
      },
      user_login: {
        auth: 'public',
        run: this.userLogin.bind(this),
      },
      user_logout: {
        auth: 'user',
        run: this.userLogout.bind(this),
      },
      user_info: {
        auth: 'user',
        run: this.getUserInfo.bind(this),
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

  async userLogin(command, data, ws) {
    const { user, pass } = data;
    if (!user || !pass) {
      return Response.sendError(command, 'user_credentials_incomplete', 'Missing user or password data');
    }

    try {
      const response = await this.data.userLogin(user, pass);
      const clientUId = await this.moduleToModule({
        command: 'client_store',
        data: {
          token: response.token,
          userId: response.id,
        },
      }, ws);
      response.clientUId = clientUId;
      return Response.sendData(command, response);
    } catch (error) {
      return Response.sendError(command, 'user_login_failed', error.message);
    }
  }

  async userLogout(command, data) {
    const { token } = data;
    try {
      const userId = await this.data.tokenToUserId(token);
      await this.moduleToModule({
        command: 'client_user_logout',
        data: {
          token,
          userId,
        },
      });
      await this.data.userLogout(token);
      return Response.sendSuccess(command);
    } catch (error) {
      return Response.sendError(command, 'user_logout_failed', error.message);
    }
  }

  async getUserInfo(command, data) {
    const { token } = data;
    try {
      const userInfo = await this.data.userInfo(token);
      return Response.sendData(command, userInfo);
    } catch (error) {
      return Response.sendError(command, 'user_info_error', error.message);
    }
  }
}

module.exports = User;
