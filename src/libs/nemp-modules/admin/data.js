const NempModuleData = require('../../module/nemp-module-data');

class AdminData extends NempModuleData {
  async adminGetAdmins() {
    const data = await this.db.read('SELECT id, user, created FROM admins');
    return data;
  }
}

module.exports = AdminData;
