const NempModule = require('../../main-module/nemp-module');
const MessageData = require('./data');
const Response = require('../../response');

class Message extends NempModule {
  constructor(moduleToModule) {
    super();
    this.moduleToModule = moduleToModule;
    this.moduleName = 'Message';
    this.moduleVersion = '1.0.0';
    this.data = new MessageData();
    this.commands = {
      message_send: {
        auth: 'user',
        run: this.send.bind(this),
      },
    };

    this.logger.log(this.getModuleInfo());
  }

  async send(command, data) {
    const { token, recipientId, message } = data;
    try {
      if (!recipientId || !message || message.length === 0) {
        return Response.sendError(command, 'message_send_error', 'Message data not valid');
      }

      const recipientExist = await this.moduleToModule({
        command: 'user_exist',
        data: {
          token,
          userId: recipientId,
        },
      });

      if (!recipientExist.data.exist) {
        return Response.sendError(command, 'message_recipient_error', 'Recipient not found');
      }

      const sender = await this.moduleToModule({
        command: 'user_token_id',
        data: {
          token,
        },
      });

      await this.data.saveMessage(sender.data.userId, recipientId, message);
      // TODO call notify module
      return Response.sendSuccess(command);
    } catch (error) {
      return Response.sendError(command, 'message_send_error', error.message);
    }
  }
}

module.exports = Message;
