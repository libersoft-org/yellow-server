const NempModuleData = require('../../module/nemp-module-data');
const Encryption = require('../../encryption');

class AdminData extends NempModuleData {
  async adminGetLogin(user, pass) {
    const res = await this.db.read('SELECT id, user, pass FROM admins WHERE user = $1', [user.toLowerCase()]);
    if (res.length === 1) {
      if (await Encryption.verifyHash(res[0].pass, pass)) {
        const token = Encryption.getToken(64);
        await this.db.write('INSERT INTO admins_login (id_admin, token) VALUES ($1, $2)', [res[0].id, token]);
        return { token, id: res[0].id };
      }
      throw new Error('Wrong username or password');
    }

    throw new Error('Found admin duplicity login');
  }

  async adminGetAdmins() {
    const data = await this.db.read('SELECT id, user, created FROM admins');
    return data;
  }
}

module.exports = AdminData;
