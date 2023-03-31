const NempModule = require('../../module/nemp-module');
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
      admin_get_admins: {
        auth: 'admin',
        run: this.getAdmins.bind(this),
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
      const response = await this.data.adminGetLogin(user, pass);
      return Response.sendData(command, response);
    } catch (error) {
      return Response.sendError(command, 'admin_login_failed', error);
    }
  }

  async getAdmins(command) {
    const data = await this.data.adminGetAdmins();
    return Response.sendData(command, data);
  }

  /*
  async adminGetTokenExists(token) {
    const res = await this.db.read('SELECT id FROM admins_login WHERE token = $1', [token]);
    return res.length === 1;
  }

  async adminIsTokenValid(token) {
    const res = await this.db.read('SELECT token, updated FROM admins_login WHERE token = $1', [token]);
    return res.length > 0;
  }

  async adminDeleteToken(token) {
    return await this.db.write('DELETE FROM admins_login WHERE token = $1', [token]);
  }

  async adminDeleteOldTokens() {
    return await this.db.write("DELETE FROM admins_login WHERE DATETIME(updated, ? || ' seconds') < DATETIME('now')", [Common.settings.admin_ttl]);
  }

  async adminUpdateTokenTime(token) {
    return await this.db.write('UPDATE admins_login SET updated = $1 WHERE token = $2', [Common.getDateTime(new Date()), token]);
  }

  async adminGetAdmins() {
    return await this.db.read('SELECT id, user, created FROM admins');
  }

  async adminAddAdmin(user, pass) {
    const callIsValidInput = this.isValidInput([user, pass]);
    if (!callIsValidInput) return this.res;
    return await this.db.write('INSERT INTO admins (user, pass) VALUES ($1, $2)', [user, await this.getHash(pass)]);
  }

  async adminSetAdmin(id, user, pass) {
    return await this.db.write('UPDATE admins SET user = $1, pass = $2 WHERE id = $3', [user, pass != '' ? `, pass = "${pass}"` : '', id]);
  }

  async adminDelAdmin(id) {
    return await this.db.write('DELETE FROM admins WHERE id = $1', [id]);
  }

  static getToken(len) {
    let res = '';
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < len; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    return res;
  }

  static async getHash(
    password,
    memoryCost = 2 ** 16,
    hashLength = 64,
    timeCost = 20,
    parallelism = 1,
  ) {
    // default: 64 MB RAM, 64 characters length, 20 difficulty to calculate, 1 thread needed
    const hash = await Argon2.hash(password, {
      memoryCost, hashLength, timeCost, parallelism,
    });

    return hash;
  }

  async verifyHash(hash, password) {
    return await Argon2.verify(hash, password);
  }
  */
}

module.exports = Admin;
