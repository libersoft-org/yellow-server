/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
const NempModuleTest = require('../../main-module/nemp-module-test');
const ExampleModule = require('./module');

class ExampleTest extends NempModuleTest {
  constructor() {
    super();
    this.module = new ExampleModule();
    this.tests = [
      {
        desc: 'Basic ',
        command: '',
        expected: 'success',
        data: {
          user: 'test',
          pass: '12345',
          firstname: 'John',
          lastname: 'Doe',
          phone: '123456',
          birth: '1.1.2111',
          gender: 'male',
        },
      },
    ];
  }
}

module.exports = ExampleTest;
