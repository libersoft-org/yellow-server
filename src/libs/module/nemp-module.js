const Logger = require('../utils/logger');

class NempModule {
  constructor() {
    this.logger = new Logger();

    this.logger.log('[Module] initialized');
  }

  getCommandPrefix() {
    if (!this.commandPrefix) {
      throw new Error('Module does not have the command prefix set');
    }
    return this.commandPrefix;
  }

  getCommandName() {
    return `${this.getCommandPrefix()}${this.getCommandName.caller.name}`;
  }
}

module.exports = NempModule;
