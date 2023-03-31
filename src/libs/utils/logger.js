const os = require('os');
const fs = require('fs');
const DateU = require('./date');

class Logger {
  constructor(logToFile = true) {
    this.logToFile = logToFile;
    this.logFile = 'nemp.log';
  }

  log(message) {
    const msg = `${DateU.getDateTime()} ${message === undefined ? '' : message}`;
    // eslint-disable-next-line no-console
    console.log(msg);
    if (this.logToFile) {
      fs.appendFileSync(this.logFile, msg + os.EOL);
    }
  }

  error(message) {
    const msg = `${DateU.getDateTime()} [ERROR] ${message}}`;
    // eslint-disable-next-line no-console
    console.error(msg);
    if (this.logToFile) {
      fs.appendFileSync(this.logFile, msg + os.EOL);
    }
  }
}

module.exports = Logger;
