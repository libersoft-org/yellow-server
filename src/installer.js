const fs = require('fs');
const prompts = require('prompts');
const Logger = require('./libs/utils/logger');
const Settings = require('./libs/settings');
const Database = require('./libs/database');
const AdminData = require('./libs/nemp-modules/admin/data');

const defaultSettings = {
  http_port: 80,
  https_port: 443,
  https_cert_path: '/etc/letsencrypt/live/{DOMAIN}/',
  web_root: '/var/www/nemp',
  admin_ttl: 600,
  log_to_file: true,
  log_file: 'nemp.log',
  db_file: 'nemp.db',
};

class ServerInit {
  static createSettings() {
    if (fs.existsSync(Settings.settingsFile)) {
      Logger.logWithoutWriteToFile(`[ERROR][Server init] settings file "${Settings.settingsFile}" already exists. If you need to replace it with default one, delete the old one first.`);
      process.exit(1);
    } else {
      fs.writeFileSync(Settings.settingsFile, JSON.stringify(defaultSettings, null, ' '));
      Logger.logWithoutWriteToFile('[Server init] settings file was created sucessfully.');
    }
  }

  static createDatabase() {
    const settings = new Settings();
    const dbFilePath = settings.getOne('db_file');

    if (dbFilePath) {
      const db = new Database();
      db.open();
    }
  }

  static installModules() {
    // TODO
    // run file install.js in every module
  }

  static deleteAdmin() {
    (async () => {
      const response = await prompts(
        [{
          type: 'text',
          name: 'username',
          message: 'Enter admin username',
        }],
      );

      try {
        const adminData = new AdminData();
        adminData.adminDeleteAccount(response.username);
        Logger.logWithoutWriteToFile(`Admin "${response.username}" was deleted sucessfully.`);
      } catch (error) {
        Logger.logWithoutWriteToFile(`Delete admin account error: ${error.message}`);
        process.exit(1);
      }
    })();
  }

  static createAdmin() {
    (async () => {
      const response = await prompts(
        [{
          type: 'text',
          name: 'username',
          message: 'Enter admin username',
        },
        {
          type: 'password',
          name: 'password',
          message: 'Enter admin password',
        }],
      );

      try {
        const adminData = new AdminData();
        adminData.adminCreateAccount(response.username, response.password);
        Logger.logWithoutWriteToFile('Admin was created sucessfully.');
      } catch (error) {
        Logger.logWithoutWriteToFile('Invalid input or invalid password length');
        process.exit(1);
      }
    })();
  }

  static createAll() {
    ServerInit.createSettings();
    ServerInit.createDatabase();
    // ServerInit.installModules();
    ServerInit.createAdmin();
    Logger.logWithoutWriteToFile('[Server init] all done!');
  }

  static getHelp() {
    Logger.logWithoutWriteToFile('Nemp server Init - command line arguments:');
    Logger.logWithoutWriteToFile('--help - to see this help');
    Logger.logWithoutWriteToFile(`--create-settings - to create default settings file called "${Settings.settingsFile}"`);
    Logger.logWithoutWriteToFile('--create-database - to create a database defined in settings file.');
    Logger.logWithoutWriteToFile('--create-admin - to create new admin account');
    Logger.logWithoutWriteToFile('--delete-admin - to delte admin account');
    Logger.logWithoutWriteToFile('--create-all - to create everything need for server run');
  }
}

const args = process.argv.slice(2);
switch (args[0]) {
  case '--create-settings':
    ServerInit.createSettings();
    break;
  case '--create-database':
    ServerInit.createDatabase();
    break;
  case '--create-admin':
    ServerInit.createAdmin();
    break;
  case '--delete-admin':
    ServerInit.deleteAdmin();
    break;
  case '--create-all':
    ServerInit.createAll();
    break;
  case '--help':
    ServerInit.getHelp();
    break;
  default:
    Logger.logWithoutWriteToFile('[Server init] no specified init process');
    ServerInit.getHelp();
    break;
}
