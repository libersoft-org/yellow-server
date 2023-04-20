const NempModuleInstall = require('../../main-module/nemp-module-install');

class MessageInstall extends NempModuleInstall {
  constructor() {
    super();
    this.dbPreparations = [
      `CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(16) PRIMARY KEY UNIQUE, 
        senderId VARCHAR(16) NOT NULL, 
        recipientId VARCHAR(16) NOT NULL, 
        message TEXT NOT NULL,
        state VARCHAR(20),
        publicKey TEXT, 
        readed TIMESTAMP,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
    ];
  }
}

module.exports = MessageInstall;
