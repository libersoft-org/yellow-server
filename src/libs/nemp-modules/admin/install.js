const NempModuleInstall = require('../../main-module/nemp-module-install');

class AdminInstall extends NempModuleInstall {
  constructor() {
    super();
    this.dbPreparations = [
      'CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, user VARCHAR(32) NOT NULL UNIQUE, pass VARCHAR(255) NOT NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
      'CREATE TABLE IF NOT EXISTS admins_login (id INTEGER PRIMARY KEY AUTOINCREMENT, id_admin INTEGER, token VARCHAR(64) NOT NULL UNIQUE, updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_admin) REFERENCES admins(id))',
      // 'CREATE NEW ADMIN USER - random name, random password - return this info into console';
    ];
  }
}

const moduleInstall = new AdminInstall();
moduleInstall.run();
