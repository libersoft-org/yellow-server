const WebServer = require('./webserver');
const Settings = require('./settings');
const Logger = require('./utils/logger');

class App {
  constructor() {
    this.settings = new Settings();
    this.logger = new Logger();
  }

  run() {
    try {
      this.webServer = new WebServer();
      this.logger.appRunInfo();
    } catch (error) {
      this.logger.error(`[APP] start server error: ${error.message}`);
    }
  }
}

module.exports = App;
