const os = require('os');
const fs = require('fs');
const DateNemp = require('./date');

class Logger {
  constructor(logToFile = true) {
    this.logToFile = logToFile;
    this.logFile = 'nemp.log';
  }

  log(message) {
    const msg = `${DateNemp.getDateTime()} ${message === undefined ? '' : message}`;
    // eslint-disable-next-line no-console
    console.log(msg);
    if (this.logToFile) {
      fs.appendFileSync(this.logFile, msg + os.EOL);
    }
  }

  error(message) {
    const msg = `${DateNemp.getDateTime()} [ERROR] ${message}}`;
    // eslint-disable-next-line no-console
    console.error(msg);
    if (this.logToFile) {
      fs.appendFileSync(this.logFile, msg + os.EOL);
    }
  }

  static logWithoutWriteToFile(message) {
    // eslint-disable-next-line no-console
    console.log(`${DateNemp.getDateTime()} [ERROR] ${message}}`);
  }
}

module.exports = Logger;
