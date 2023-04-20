const crypto = require('crypto');
const NempModuleData = require('../../main-module/nemp-module-data');

class MessageData extends NempModuleData {
  async saveMessage(senderId, recipientId, message) {
    const messageId = crypto.randomBytes(16).toString('hex');
    // const message = TODO use crypto for message content

    await this.db.write('INSERT INTO messages (id, senderId, recipientId, message) VALUES ($1, $2, $3, $4)', [
      messageId,
      senderId,
      recipientId,
      message,
    ]);
  }
}

module.exports = MessageData;
