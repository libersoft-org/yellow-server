const Database = require('./database');
const Logger = require('./utils/logger');
const DateNemp = require('./utils/date');
const Settings = require('./settings');

class Authorization {
  constructor() {
    this.db = new Database();
    this.logger = new Logger();
    this.settings = new Settings();
  }

  async adminTokenIsValid(token) {
    const res = await this.db.read('SELECT token, updated FROM admins_login WHERE token = $1', [token]);
    return res.length > 0;
  }

  async adminDeleteOldTokens() {
    await this.db.write("DELETE FROM admins_login WHERE DATETIME(updated, ? || ' seconds') < DATETIME('now')", [this.settings.getOne('admin_ttl')]);
  }

  async adminUpdateTokenTime(token) {
    await this.db.write('UPDATE admins_login SET updated = $1 WHERE token = $2', [DateNemp.getDateTime(new Date()), token]);
  }

  async userTokenIsValid(token) {
    const res = await this.db.read('SELECT token, updated FROM users_login WHERE token = $1', [token]);
    return res.length > 0;
  }

  async userDeleteOldTokens() {
    await this.db.write("DELETE FROM users_login WHERE DATETIME(updated, ? || ' seconds') < DATETIME('now')", [this.settings.getOne('user_ttl')]);
  }

  async userUpdateTokenTime(token) {
    await this.db.write('UPDATE users_login SET updated = $1 WHERE token = $2', [DateNemp.getDateTime(new Date()), token]);
  }

  /**
   * Check authorization for command run
   * @param {string} auth 'public, user, admin'
   * @param {object} data
   */
  async checkPermission(auth, data) {
    if (auth === 'public') {
      return true;
    }

    if (!data.token) {
      return false;
    }

    switch (auth) {
      case 'user':
      {
        const result = await this.userTokenIsValid(data.token);

        if (result === true) {
          await this.userDeleteOldTokens(); // potencial performance issue - move to crone job
          await this.userUpdateTokenTime(data.token);
        }

        return result;
      }
      case 'admin': {
        const result = await this.adminTokenIsValid(data.token);

        if (result === true) {
          await this.adminDeleteOldTokens();
          await this.adminUpdateTokenTime(data.token);
        }

        return result;
      }
      default:
        this.logger.log(`[Authorization] authorization type ${auth} not found - command: ${data.command}`);
        return false;
    }
  }
}

module.exports = Authorization;
