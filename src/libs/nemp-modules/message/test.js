const NempModuleTest = require('../../main-module/nemp-module-test');
const MessageModule = require('./module');

class MessageTest extends NempModuleTest {
  constructor() {
    super();
    this.module = new MessageModule();
    this.tests = [
      {
        desc: 'Basic ',
        command: '',
        expected: 'success',
        data: {},
      },
    ];
  }
}

module.exports = MessageTest;
