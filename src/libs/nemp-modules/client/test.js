const NempModuleTest = require('../../main-module/nemp-module-test');
const ClientModule = require('./module');

class ClientTest extends NempModuleTest {
  constructor() {
    super();
    this.module = new ClientModule();
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

module.exports = ClientTest;
