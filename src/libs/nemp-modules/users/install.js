/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */

const NempModuleInstall = require('../../main-module/nemp-module-install');

class UsersInstall extends NempModuleInstall {
  constructor() {
    super();
    this.dbPreparations = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        user VARCHAR(100) NOT NULL UNIQUE, 
        pass VARCHAR(255) NOT NULL, 
        firstname VARCHAR(255) NOT NULL,
        lastname VARCHAR(255) NOT NULL,
        phone VARCHAR(100) NOT NULL,
        birth VARCHAR(50), 
        gender VARCHAR(32),
        confirmed BIT,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      'CREATE TABLE IF NOT EXISTS users_login (id INTEGER PRIMARY KEY AUTOINCREMENT, id_user INTEGER, token VARCHAR(64) NOT NULL UNIQUE, updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_user) REFERENCES users(id))',
    ];
  }
}

module.exports = UsersInstall;
