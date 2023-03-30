const os = require('os');
const fs = require('fs');

class Logger {
  constructor(logToFile = true) {
    this.logToFile = logToFile;
    this.logFile = 'nemp.log';
  }

  log(message) {
    const msg = `${Logger.getDateTime()} ${message === undefined ? '' : message}`;
    // eslint-disable-next-line no-console
    console.log(msg);
    if (this.logToFile) {
      fs.appendFileSync(this.logFile, msg + os.EOL);
    }
  }

  static getDateTime() {
    function toString(number, padLength) { return number.toString().padStart(padLength, '0'); }
    const date = new Date();
    return `${toString(date.getFullYear(), 4)
    }-${toString(date.getMonth() + 1, 2)
    }-${toString(date.getDate(), 2)
    } ${toString(date.getHours(), 2)
    }:${toString(date.getMinutes(), 2)
    }:${toString(date.getSeconds(), 2)}`;
  }
}

module.exports = Logger;
