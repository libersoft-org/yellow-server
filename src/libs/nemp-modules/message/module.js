const NempModule = require('../../main-module/nemp-module');
const MessageData = require('./data');
const Response = require('../../response');

class Message extends NempModule {
  constructor() {
    super();
    this.moduleName = 'Message';
    this.moduleVersion = '1.0.0';
    this.data = new MessageData();
    this.commands = {
      first_command: {
        auth: 'public',
        run: () => {},
      },
    };

    this.logger.log(this.getModuleInfo());
  }
}

module.exports = Message;
