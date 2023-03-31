const Database = require('./db/database');
const Logger = require('./utils/logger');

class Authorization {
  constructor() {
    this.db = new Database();
    this.logger = new Logger();
  }

  async adminTokenIsValid(token) {
    const res = await this.db.read('SELECT token, updated FROM admins_login WHERE token = $1', [token]);
    return res.length > 0;
  }

  /**
   * Check authorization for command run
   * @param {string} auth 'public, user, admin'
   * @param {object} data
   */
  async checkPermission(auth, data) {
    console.log('auth', auth, data);
    if (auth === 'public') {
      return true;
    }

    if (!data.token) {
      return false;
    }

    switch (auth) {
      case 'user':
        // not implemented now
        break;
      case 'admin': {
        const result = await this.adminTokenIsValid(data.token);
        return result;
      }
      default:
        this.logger.log(`[Authorization] authorization type ${auth} not found - command: ${data.command}`);
        return false;
    }

    return false;
  }
}

module.exports = Authorization;
