const Common = require('./common.js').Common;
const WebServer = require('./webserver.js');
const fs = require('fs');
let prompt = require('prompt');

class App {
 run() {
  const args = process.argv.slice(2);
  switch (args.length) {
   case 0:
    this.startServer();
    break;
   case 1:
    if (args[0] === '--create-settings') this.createSettings();
    if (args[0] === '--create-database') this.createDatabase();
    if (args[0] === '--create-admin') this.createAdmin();
    else this.getHelp();
    break;
   default:
    this.getHelp();
    break;
   }
  }

 startServer() {
  try {
   this.loadSettings();
   const header = Common.appName + ' v.' + Common.appVersion;
   const dashes = '='.repeat(header.length);
   Common.addLog('');
   Common.addLog(dashes);
   Common.addLog(header);
   Common.addLog(dashes);
   Common.addLog('');
   this.webServer = new WebServer();
  } catch (ex) {
   Common.addLog(ex);
  }
 }

 getHelp() {
  Common.addLog('Command line arguments:');
  Common.addLog('');
  Common.addLog('--help - to see this help');
  Common.addLog('--create-settings - to create default settings file called "' + Common.settingsFile + '"');
  Common.addLog('--create-database - to create a database defined in settings file.');
  Common.addLog('');
 }

 loadSettings() {
  if (fs.existsSync(Common.settingsFile)) {
   Common.settings = JSON.parse(fs.readFileSync(Common.settingsFile, { encoding:'utf8', flag:'r' }));
  } else {
   Common.addLog('Error: Settings file "' + Common.settingsFile + '" not found. Please run this application again using: node index.js --create-settings');
   Common.addLog('');
   process.exit(1);
  }
 }

 createSettings() {
  if (fs.existsSync(Common.settingsFile)) {
   Common.addLog('Error: Settings file "' + Common.settingsFile +  '" already exists. If you need to replace it with default one, delete the old one first.');
   Common.addLog('');
   process.exit(1);
  } else {
   var settings = {
    http_port: 80,
    https_port: 443,
    https_cert_path: '/etc/letsencrypt/live/{DOMAIN}/',
    web_notfound_path: 'www/notfound',
    webs: [
     {
      run: true,
      url: '/webadmin',
      path: 'www/webadmin'
     }, {
      run: true,
      url: '/webmail',
      path: 'www/webmail'
     }, {
      run: true,
      url: '/console',
      path: 'www/console'
     }
    ],
    webadmin_ttl: 600,
    log_to_file: true,
    log_file: 'nemp.log',
    db_file: 'nemp.db'
   }
   fs.writeFileSync(Common.settingsFile, JSON.stringify(settings, null, ' '));
   Common.addLog('Settings file was created sucessfully.');
   Common.addLog('');
  }
 }

 createDatabase() {
  this.loadSettings();
  const Data = require('./data.js');
  const data = new Data();
  data.createDB();
  Common.addLog('Database was created sucessfully.');
  Common.addLog('');
 }

createAdmin() {
  var username = '', password = '';
  this.loadSettings();
  const Data = require('./data.js');
  const data = new Data();
  var schema = {
    properties: {
      username: {
        pattern: /^[a-zA-Z\s\-]+$/,
        message: 'Name must be only letters, spaces, or dashes',
        required: true
      },
      password: {
        hidden: true,
        required: true
      }
    }
  };
  prompt.start();
  prompt.get(schema, function (err, result) {
    if(err) throw err;
    username = result.username;
    password = result.password;
    data.adminAddAdmin(username, password);
    Common.addLog('Admin was created sucessfully.');
  });
  Common.addLog('');
 }
}

module.exports = App;
