class NempModule {
  getCommandPrefix() {
    if (!this.commandPrefix) {
      throw new Error('Module does not have the command prefix set');
    }
    return this.commandPrefix;
  }

  getCommandName() {
    return `${this.getCommandName()}${this.getCommandName.caller.name}`;
  }
}

module.exports = NempModule;
