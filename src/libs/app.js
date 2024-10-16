import WebServer from './webserver.js';
import Data from './data.js';
import Modules from './modules.js';
import { Common } from './common.js';

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
    else this.getHelp();
    break;
   default:
    this.getHelp();
    break;
  }
 }

 async startServer() {
  try {
   await this.loadSettings();
   const header = Common.appName + ' ver. ' + Common.appVersion;
   const dashes = '='.repeat(header.length);
   Common.addLog(dashes);
   Common.addLog(header);
   Common.addLog(dashes);
   Common.addLog('');
   await this.checkDatabase();
   this.webServer = new WebServer();
   await this.webServer.start();
   this.modules = new Modules();
   Common.addLog('Server is running: ' + (Common.settings.web.standalone ? 'http://localhost:' + Common.settings.web.http_port : 'socket'));
  } catch (ex) {
   Common.addLog(ex);
  }
 }

 getHelp() {
  Common.addLog('Command line arguments:');
  Common.addLog('');
  Common.addLog('--help - to see this help');
  Common.addLog('--create-settings - to create a default settings file named "' + Common.settingsFile + '"');
  Common.addLog('--create-database - to create a tables in database defined in the settings file');
  Common.addLog('--create-admin - to create an admin account');
 }

 async loadSettings() {
  const file = Bun.file(Common.settingsFile);
  if (await file.exists()) {
   try {
    Common.settings = await file.json();
   } catch {
    Common.addLog('Settings file "' + Common.settingsFile + '" has an invalid format.', 2);
    process.exit(1);
   }
  } else {
   Common.addLog('Settings file "' + Common.settingsFile + '" not found. Please run this application again using: "./start.sh --create-settings"', 2);
   process.exit(1);
  }
 }

 async createSettings() {
  const file = Bun.file(Common.settingsFile);
  if (await file.exists()) {
   Common.addLog('Settings file "' + Common.settingsFile + '" already exists. If you need to replace it with default one, delete the old one first.', 2);
   process.exit(1);
  } else {
   var settings = {
    web: {
     standalone: true,
     http_port: 80,
     https_port: 443,
     certificates_path: '/etc/letsencrypt/live/{DOMAIN}/',
     socket_path: 'server.sock',
     web_paths: [
      {
       route: '/',
       path: 'www'
      }
     ]
    },
    database: {
     host: '127.0.0.1',
     port: 3306,
     user: 'your_username',
     password: 'your_password',
     name: 'yellow'
    },
    other: {
     session_admin: 600, // 10 minutes
     session_user: 2592000, // 30 days
     session_cleaner: 600, // 10 minutes
     db_file: 'server.db',
     log_file: 'server.log',
     log_to_file: true
    }
   };
   await Bun.write(Common.settingsFile, JSON.stringify(settings, null, 1));
   Common.addLog('Settings file was created sucessfully.');
  }
 }

 async checkDatabase() {
  const data = new Data();
  if (!(await data.databaseExists())) {
   Common.addLog('Database is not yet created. Please run "./start.sh --create-database" first.', 2);
   process.exit(1);
  }
 }

 async createDatabase() {
  await this.loadSettings();
  const data = new Data();
  await data.createDB();
  Common.addLog('Database creation completed.');
  process.exit(1);
 }

 async createAdmin() {
  await this.loadSettings();
  let username;
  let password;
  while (true) {
   username = await this.getInput('Enter the admin username', false, 'admin');
   username = username.toLowerCase();
   if (username.length < 3 || username.length > 16 || !/^(?!.*[_.-]{2})[a-z0-9]+([_.-]?[a-z0-9]+)*$/.test(username)) Common.addLog('Invalid username. Username must be 3-16 characters long, can contain only English alphabet letters, numbers, and special characters (_ . -), but not at the beginning, end, or two in a row.');
   else break;
  }
  while (true) {
   password = await this.getInput('Enter the admin password', true);
   if (password.length < 8) Common.addLog('Password has to be 8 or more characters long.');
   else break;
  }
  const data = new Data();
  await data.adminAdminsAdd(username, password);
  Common.addLog('Admin was created successfully.');
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
