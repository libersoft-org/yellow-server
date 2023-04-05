const NempModuleData = require('../../main-module/nemp-module-data');
const Encryption = require('../../encryption');
const Validation = require('../../utils/validation');

class AdminData extends NempModuleData {
  async adminLogin(user, pass) {
    const res = await this.db.read('SELECT id, user, pass FROM admins WHERE user = $1', [user.toLowerCase()]);

    if (await Encryption.verifyHash(res[0].pass, pass)) {
      const token = Encryption.getToken(64);
      await this.db.write('INSERT INTO admins_login (id_admin, token) VALUES ($1, $2)', [res[0].id, token]);
      return { token, id: res[0].id };
    }
    throw new Error('Wrong username or password');
  }

  async adminLogout(token) {
    const isTokenExist = await this.db.read('SELECT id FROM admins_login WHERE token = $1', [token]);

    if (!isTokenExist) {
      throw new Error('Token not exist');
    }

    await this.db.write('DELETE FROM admins_login WHERE token = $1', [token]);
  }

  async adminGetAdmins() {
    const data = await this.db.read('SELECT id, user, created FROM admins');
    return data;
  }

  async adminGetUsers() {
    const data = await this.db.read('SELECT id, user, created FROM users');
    return data;
  }

  async adminCreateAccount(username, pass) {
    if (!Validation.isValidAdminUserName(username) || !Validation.isValidAdminPass(pass)) {
      throw new Error('Invalid username or password ');
    }

    const data = await this.db.write('INSERT INTO admins (user, pass) VALUES ($1, $2)', [username, await Encryption.getHash(pass)]);
    return data;
  }

  async adminDeleteAccount(username) {
    await this.db.write('DELETE FROM admins WHERE user = $1', [username]);
  }

  async userDeleteAccount(userId) {
    const result = await this.db.write('DELETE FROM users WHERE id = $1', [userId]);

    if (result && result.error) {
      throw new Error(result.error.message);
    }

    return result;
  }
}

module.exports = AdminData;
