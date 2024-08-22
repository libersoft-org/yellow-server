import os from 'os';
import fs from 'fs';
import path from 'path';

class Common {
 static appName = 'Yellow Server';
 static appVersion = '0.01';
 static appPath = path.dirname(import.meta.dir) + '/';
 static settingsFile = path.join(path.dirname(import.meta.dir), 'settings.json');
 static settings;

 static addLog(message, type = 0) {
  const d = new Date();
  const date = d.toLocaleString('sv-SE').replace('T', ' ');
  const logTypes = [
   { text: 'INFO', color: '\x1b[32m' },
   { text: 'WARNING', color: '\x1b[33m' },
   { text: 'ERROR', color: '\x1b[31m' }
  ];
  const msg = message ?? '';
  console.log('\x1b[96m' + date + '\x1b[0m [' + logTypes[type].color + logTypes[type].text + '\x1b[0m] ' + msg);
  if (this.settings?.other?.log_to_file) fs.appendFileSync(this.appPath + this.settings.other.log_file, date + ' [' + logTypes[type].text + '] ' + msg + os.EOL);
 }

 static isValidJSON(text) {
  try {
   JSON.parse(text);
   return true;
  } catch (e) {
   return false;
  }
 }
}

export { Common };
