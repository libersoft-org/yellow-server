import WebServer from './webserver.js';
import Data from './data.js';
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
    else if (args[0] === '--create-database') this.createDatabase();
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
   const header = Common.appName + ' v.' + Common.appVersion;
   const dashes = '='.repeat(header.length);
   Common.addLog('');
   Common.addLog(dashes);
   Common.addLog(header);
   Common.addLog(dashes);
   Common.addLog('');
   this.webServer = new WebServer();
   await this.webServer.run();
  } catch (ex) {
   Common.addLog(ex);
  }
 }

 getHelp() {
  Common.addLog('Command line arguments:');
  Common.addLog('');
  Common.addLog('--help - to see this help');
  Common.addLog('--create-settings - to create a default settings file named "' + Common.settingsFile + '"');
  Common.addLog('--create-database - to create a database defined in the settings file');
  Common.addLog('--create-admin - to create an admin account');
  Common.addLog('');
 }

 async loadSettings() {
  const file = Bun.file(Common.settingsFile);
  if (await file.exists()) {
   Common.settings = await file.json(); // TODO: otestovat, kdyz nebude validni JSON
  } else {
   Common.addLog('Error: Settings file "' + Common.settingsFile + '" not found. Please run this application again using: node index.js --create-settings');
   Common.addLog('');
   process.exit(1);
  }
 }

 async createSettings() {
  const file = Bun.file(Common.settingsFile);
  if (await file.exists()) {
   Common.addLog('Error: Settings file "' + Common.settingsFile + '" already exists. If you need to replace it with default one, delete the old one first.');
   Common.addLog('');
   process.exit(1);
  } else {
   var settings = {
    web: {
     standalone: true,
     http_port: 80,
     https_port: 443,
     certificates_path: '/etc/letsencrypt/live/{DOMAIN}/',
     socket_path: '/run/yellow-server.sock'
    },
    other: {
     ttl_admin: 600,
     ttl_user: 600,
     db_file: 'yellow-server.db',
     log_file: 'yellow-server.log',
     log_to_file: true
    }
   };
   await Bun.write(Common.settingsFile, JSON.stringify(settings, null, 1));
   Common.addLog('Settings file was created sucessfully.');
   Common.addLog('');
  }
 }

 createDatabase() {
  this.loadSettings();
  const data = new Data();
  data.createDB();
  Common.addLog('Database was created sucessfully.');
  Common.addLog('');
 }

 async createAdmin() {
  while (true) {
   let username = await this.getInput('Enter the admin username:');
   username = username.toLowerCase();
   if (username.length >= 3 && username.length <= 16 && /^(?!.*[_.-]{2})[a-z0-9]+([_.-]?[a-z0-9]+)*$/.test(username)) break;
   else Common.addLog('Invalid username. Username must be 3-16 characters long, can contain only English alphabet letters, numbers, and special characters (_ . -), but not at the beginning, end, or two in a row.');
  }
  while (true) {
   let password = await this.getInput('Enter the admin password:', true);
   if (password.length >= 8) {
    this.loadSettings();
    const data = new Data();
    data.adminAddAdmin(username, password);
    Common.addLog('Admin was created successfully.');
    break;
   } else Common.addLog('Password has to be 8 or more characters long.');
  }
 }

 async getInput(promptMessage, isPassword = false, defaultValue = '') {
  let input = '';
  process.stdout.write(promptMessage + (defaultValue ? '[' + defaultValue + ']' : '') + ': ');
  for await (const chunk of process.stdin) {
   const char = new TextDecoder().decode(chunk);
   if (char === '\n') {
    input = input || defaultValue;
    break;
   }
   if (isPassword) process.stdout.write('*');
   else process.stdout.write(char);
   input += char;
  }
  return input;
 }
}

export default App;
