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

  static moduleInstallation() {
    (async () => {
      const response = await prompts(
        [{
          type: 'text',
          name: 'module',
          message: 'Enter module name',
        }],
      );

      const moduleInstallPath = `./libs/nemp-modules/${response.module}/install.js`;

      if (fs.existsSync(moduleInstallPath)) {
        try {
          // eslint-disable-next-line import/no-dynamic-require, global-require
          const ModuleInstall = require(`${moduleInstallPath}`);
          const moduleInstall = new ModuleInstall();
          await moduleInstall.run();
          Logger.logWithoutWriteToFile(`[MODULE INSTALL] Module ${response.module} installed sucessfully.`);
        } catch (error) {
          Logger.logWithoutWriteToFile(`[ERROR][MODULE INSTALL] ${error.message}`);
          process.exit(1);
        }
      } else {
        Logger.logWithoutWriteToFile(`[ERROR][MODULE INSTALL] not found install file "${moduleInstallPath}"`);
        process.exit(1);
      }
    })();
  }

  static moduleTest() {
    (async () => {
      const response = await prompts(
        [{
          type: 'text',
          name: 'module',
          message: 'Enter module name',
        }],
      );

      const moduleTestPath = `./libs/nemp-modules/${response.module}/test.js`;

      if (fs.existsSync(moduleTestPath)) {
        try {
          // eslint-disable-next-line import/no-dynamic-require, global-require
          const ModuleTest = require(`${moduleTestPath}`);
          const moduleTest = new ModuleTest();
          await moduleTest.run();
          Logger.logWithoutWriteToFile(`[MODULE TEST] Module ${response.module} tested sucessfully.`);
        } catch (error) {
          Logger.logWithoutWriteToFile(`[ERROR][MODULE TEST] ${error.message}`);
          process.exit(1);
        }
      } else {
        Logger.logWithoutWriteToFile(`[ERROR][MODULE TEST] not found test file "${moduleTestPath}"`);
        process.exit(1);
      }
    })();
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
    Logger.logWithoutWriteToFile('--module-create - create new empty module');
    Logger.logWithoutWriteToFile('--module-install - install specific module');
    Logger.logWithoutWriteToFile('--module-test - test specific module');
    // Logger.logWithoutWriteToFile('--create-all - to create everything need for server run');
  }

  static createModule() {
    (async () => {
      const response = await prompts(
        [{
          type: 'text',
          name: 'moduleName',
          message: 'Enter new module name - first letter Capital',
        }],
      );

      const { moduleName } = response;
      const moduleInstallPath = `./libs/nemp-modules/${moduleName.toLowerCase()}/`;

      const moduleBase = `const NempModule = require('../../main-module/nemp-module');
const ${moduleName}Data = require('./data');
const Response = require('../../response');

class ${moduleName} extends NempModule {
  constructor() {
    super();
    this.moduleName = '${moduleName}';
    this.moduleVersion = '1.0.0';
    this.data = new ${moduleName}Data();
    this.commands = {
      first_command: {
        auth: 'public',
        run: () => {},
      },
    };

    this.logger.log(this.getModuleInfo());
  }
}

module.exports = ${moduleName};
`;

      const moduleData = `const NempModuleData = require('../../main-module/nemp-module-data');

class ${moduleName}Data extends NempModuleData {
}

module.exports = ${moduleName}Data;
`;

      const moduleInstall = `const NempModuleInstall = require('../../main-module/nemp-module-install');

class ${moduleName}Install extends NempModuleInstall {
  constructor() {
    super();
    this.dbPreparations = [
    ];
  }
}

module.exports = ${moduleName}Install;
`;

      const moduleTests = `const NempModuleTest = require('../../main-module/nemp-module-test');
const ${moduleName}Module = require('./module');

class ${moduleName}Test extends NempModuleTest {
  constructor() {
    super();
    this.module = new ${moduleName}Module();
    this.tests = [
      {
        desc: 'Basic ',
        command: '',
        expected: 'success',
        data: {},
      },
    ];
  }
}

module.exports = ${moduleName}Test;
`;

      fs.mkdirSync(moduleInstallPath, { recursive: true });
      fs.writeFileSync(`${moduleInstallPath}module.js`, moduleBase);
      fs.writeFileSync(`${moduleInstallPath}data.js`, moduleData);
      fs.writeFileSync(`${moduleInstallPath}install.js`, moduleInstall);
      fs.writeFileSync(`${moduleInstallPath}test.js`, moduleTests);
      fs.writeFileSync(`${moduleInstallPath}README.md`, `NEMP MODULE ${moduleName}`);

      Logger.logWithoutWriteToFile(`[MODULE CREATE] ${moduleName} empty files for module created`);
    })();
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
  case '--module-create':
    ServerInit.createModule();
    break;
  case '--module-install':
    ServerInit.moduleInstallation();
    break;
  case '--module-test':
    ServerInit.moduleTest();
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
