const Logger = require('../utils/logger');
const Authorization = require('../authorization');
const Response = require('../response');

class NempModule {
  constructor() {
    this.logger = new Logger();
    this.authorization = new Authorization();
    this.moduleName = null;
    this.moduleVersion = null;
    this.data = null;
    this.commands = null;
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

  getModuleInfo() {
    return `[Modul ${this.moduleName}] version: ${this.moduleVersion} commands: ${Object.keys(this.commands).length}`;
  }

  getModuleCommandsList() {
    const commands = {};
    Object.keys(this.commands).forEach((command) => {
      commands[command] = this.moduleName;
    });
    return commands;
  }

  async runCommand(command, data = {}) {
    this.logger.log(`[Module ${this.moduleName}] RUN command: ${command} data: ${JSON.stringify(data)}`);

    if (this.commands[command]) {
      // eslint-disable-next-line max-len
      const authorization = await this.authorization.checkPermission(this.commands[command].auth, data);
      if (!authorization) {
        return Response.sendError(command, 'authorization_failed', 'Authorization error - check token validity');
      }

      return this.commands[command].run(command, data);
    }

    return Response.sendError(command, 'command_not_found', `[${this.moduleName}] Command not found`);
  }
}

module.exports = NempModule;
