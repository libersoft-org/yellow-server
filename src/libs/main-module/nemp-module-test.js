const WebSocket = require('ws');
const Logger = require('../utils/logger');

class NempModuleTest {
  constructor() {
    this.logger = new Logger();
    this.ws = null;
    this.test = null;

    this.wsConnect();
  }

  wsConnect() {
    try {
      this.ws = new WebSocket('ws://localhost/', {
        perMessageDeflate: false,
      });
      this.ws.onopen = this.wsOpen.bind(this);
      this.ws.onclose = this.wsClose.bind(this);
      this.ws.onerror = this.wsError.bind(this);
      this.ws.onmessage = this.wsMessage.bind(this);
    } catch (error) {
      this.logger.error(`[MODULE TEST] ${error.message}`);
    }
  }

  wsOpen() {
    this.logger.log('[MODULE TEST] websocket open');
  }

  wsClose() {
    this.logger.log('[MODULE TEST] websocket closed');
  }

  wsError(e) {
    this.logger.error(`[MODULE TEST] websocket error: ${e.message}`);
  }

  wsMessage(e) {
    this.logger.log(`[MODULE TEST] websocket message ${JSON.stringify(e.data)}`);
  }

  run() {
    this.logger.log('[MODULE TEST] RUN');
  }
}

module.exports = NempModuleTest;
