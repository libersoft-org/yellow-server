import { EOL } from 'os';
import { appendFileSync } from 'fs';

class Common {
 static appName = 'Yellow Server';
 static appVersion = '0.01';
 static settingsFile = 'settings.json';
 static appPath = import.meta.dir + '/';
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
  if (this.settings?.other?.log_to_file) appendFileSync(this.appPath + this.settings.other.log_file, date + ' [' + logTypes[type].text + '] ' + msg + EOL);
 }

 static translate(template, dictionary) {
  for (const key in dictionary) template = template.replaceAll(key, dictionary[key]);
  return template;
 }
}

export { Common };
