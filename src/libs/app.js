import WebServer from './webserver.js';
import Data from './data';
import Modules from './modules.js';
import { Info } from './info.js';
import { newLogger, testLogging, reconfigureLogging } from 'yellow-server-common';

let Log = newLogger('app');

class App {
 async run() {
  const args = process.argv.slice(2);
  switch (args.length) {
   case 0:
    await this.startServer();
    break;
   case 1:
    if (args[0] === '--create-settings') await this.createSettings();
    else if (args[0] === '--create-database') await this.createDatabase();
    else if (args[0] === '--create-admin') this.createAdmin();
    else if (args[0] === '--init-modules') this.initModules();
    else this.getHelp();
    break;
   default:
    this.getHelp();
    break;
  }
 }

 async startServer() {
  //try {
  await this.loadSettings();
  const header = Info.appName + ' ver. ' + Info.appVersion;
  const dashes = '='.repeat(header.length);
  Log.info(dashes);
  Log.info(header);
  Log.info(dashes);
  Log.info('');
  await this.checkDatabase();

  reconfigureLogging(Info.settings);
  Log.info('app start');
  //testLogging();

  this.modules = new Modules(this);
  this.webServer = new WebServer(this.modules);
  await this.modules.init();
  await this.webServer.start(this.modules);
  Log.info('Server is running: ' + (Info.settings.web.standalone ? 'http://localhost:' + Info.settings.web.http_port : 'socket'));
  /*} catch (ex) {
   Log.error('startServer:');
   //Log.error(ex);
   //console.error(ex);
   console.trace(ex);
  }*/
 }

 getHelp() {
  console.log('Command line arguments:');
  console.log('');
  console.log('--help - to see this help');
  console.log('--create-settings - to create a default settings file named "' + Info.settingsFile + '"');
  console.log('--create-database - to create tables in database defined in the settings file');
  console.log('--create-admin - to create an admin account');
  console.log('--init-modules - to initialize the modules table with default values');
 }

 async loadSettings() {
  const file = Bun.file(Info.settingsFile);
  if (await file.exists()) {
   try {
    Info.settings = await file.json();
    Log.settings = Info.settings;
    Log.appPath = Info.appPath;
   } catch {
    Log.error('Settings file "' + Info.settingsFile + '" has an invalid format.');
    process.exit(1);
   }
  } else {
   Log.error('Settings file "' + Info.settingsFile + '" not found. Please run this application again using: "./start.sh --create-settings"');
   process.exit(1);
  }
 }

 async createSettings() {
  const file = Bun.file(Info.settingsFile);
  if (await file.exists()) {
   Log.error('Settings file "' + Info.settingsFile + '" already exists. If you need to replace it with default one, delete the old one first.');
   process.exit(1);
  } else {
   var settings = {
    web: {
     standalone: true,
     http_port: 80,
     https_port: 443,
     certificates: [
      {
       domain: '{DOMAIN}',
       private: '/etc/letsencrypt/live/{DOMAIN}/privkey.pem',
       public: '/etc/letsencrypt/live/{DOMAIN}/cert.pem',
      },
     ],
     socket_path: 'server.sock',
     web_paths: [
      {
       route: '/',
       path: 'www',
      },
     ],
    },
    database: {
     host: '127.0.0.1',
     port: 3306,
     user: 'username',
     password: 'password',
     name: 'yellow',
    },
    log: {
     level: 'trace',

     stdout: {
      enabled: true,
      levels: [{ '*': 'info' }],
     },
     file: {
      enabled: true,
      name: 'server.log',
      levels: [{ '*': 'info' }],
     },
     database: {
      enabled: true,
      level: 'debug',
     },
     json: {
      enabled: true,
      name: 'json.log',
      level: 'trace',
     },
     elasticsearch: {
      enabled: true,
     },
    },
    session: {
     admin: 600, // 10 minutes
     user: 2592000, // 30 days
     cleaner: 600, // 10 minutes
    },
   };
   await Bun.write(Info.settingsFile, JSON.stringify(settings, null, 1));
   Log.info('Settings file was created sucessfully.');
  }
 }

 async checkDatabase() {
  //console.log('checkDatabase0');
  const data = new Data();
  //console.log('checkDatabase1');
  if (!(await data.databaseExists())) {
   //console.log('checkDatabase2');
   Log.error('Database is not yet created. Please run "./start.sh --create-database" first.');
   process.exit(1);
  }
  //console.log('checkDatabase3');
 }

 async createDatabase() {
  await this.loadSettings();
  const data = new Data();
  await data.createDB();
  Log.info('Database creation completed.');
  await data.close();
  process.exit(1);
 }

 async createAdmin() {
  await this.loadSettings();
  let username;
  let password;
  while (true) {
   username = await this.getInput('Enter the admin username', false, 'admin');
   username = username.toLowerCase();
   if (username.length < 3 || username.length > 16 || !/^(?!.*[_.-]{2})[a-z0-9]+([_.-]?[a-z0-9]+)*$/.test(username)) {
    Log.error('Invalid username. Username must be 3-16 characters long, can contain only English alphabet letters, numbers, and special characters (_ . -), but not at the beginning, end, or two in a row.');
   } else break;
  }
  while (true) {
   password = await this.getInput('Enter the admin password', true);
   if (password.length < 8) Log.error('Password has to be 8 or more characters long.');
   else break;
  }
  const data = new Data();
  await data.adminAdminsAdd(username, password);
  Log.info('Admin was created successfully.');
  process.exit(1);
 }

 async initModules() {
  await this.loadSettings();
  const data = new Data();

  data.adminModulesAdd('org.libersoft.messages', 'ws://localhost:25001/');
  Log.info('Added module messages.');
  let res = await data.adminModulesList(null);

  Log.info('Modules were initialized successfully.');
  process.exit(1);
 }

 async getInput(promptMessage, isPassword = false, defaultValue = '') {
  return new Promise(resolve => {
   let input = '';
   process.stdin.setRawMode(true);
   process.stdin.resume();
   process.stdout.write(promptMessage + (defaultValue ? ' [' + defaultValue + ']' : '') + ': ');
   const onData = chunk => {
    const char = chunk.toString();
    if (char === '\n' || char === '\r') {
     process.stdin.setRawMode(false);
     process.stdin.removeListener('data', onData);
     input = input.trim() || defaultValue;
     process.stdout.write('\n');
     resolve(input);
    } else if (char === '\u0003') {
     process.stdin.setRawMode(false);
     process.exit();
    } else if (char === '\u007f') {
     if (input.length > 0) {
      input = input.slice(0, -1);
      process.stdout.write('\b \b');
     }
    } else {
     if (isPassword) process.stdout.write('*');
     else process.stdout.write(char);
     input += char;
    }
   };
   process.stdin.on('data', onData);
  });
 }
}

export default App;
