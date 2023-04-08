const crypto = require('crypto');
const NempModule = require('../../main-module/nemp-module');

class Client extends NempModule {
  constructor() {
    super();
    this.moduleName = 'Client';
    this.moduleVersion = '1.0.0';
    this.clients = {};
    this.commands = {
      client_store: {
        auth: 'user',
        run: this.storeUserClient.bind(this),
      },
      client_user_logout: {
        auth: 'user',
        run: this.removeAllUserClients.bind(this),
      },
    };

    this.logger.log(this.getModuleInfo());
  }

  storeUserClient(command, data, ws) {
    const { userId } = data;
    return new Promise((resolve) => {
      const websocket = ws;
      if (!this.clients[userId]) {
        this.clients[userId] = {
          connections: [],
        };
      }

      const clientUid = crypto.randomBytes(16).toString('hex');
      websocket.clientUid = clientUid;

      websocket.addEventListener('close', () => {
        this.removeUserClient(userId, clientUid);
      });

      this.clients[userId].connections.push(websocket);
      this.logger.log(`[MODULE ${this.moduleName}] store user client ${userId} - wsId: ${clientUid}`);
      resolve(clientUid);
    });
  }

  removeUserClient(userId, clientUid) {
    if (this.clients[userId]) {
      // eslint-disable-next-line max-len
      this.clients[userId].connections = this.clients[userId].connections.filter((websocket) => !websocket.clientUid === clientUid);
    }
  }

  removeAllUserClients(command, data) {
    const { userId } = data;
    if (this.clients[userId]) {
      delete this.clients[userId];
    }
  }

  callUserClients(userId, command, data) {
    if (this.clients[userId]) {
      this.clients[userId].connections.forEach((websocket) => {
        websocket.send(command, data);
      });
    }
  }
}

module.exports = Client;
