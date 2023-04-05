const NempModuleTest = require('../../main-module/nemp-module-test');
const UserModule = require('./module');

class UsersTest extends NempModuleTest {
  constructor() {
    super();
    this.module = new UserModule();
    this.tests = [
      {
        desc: 'Create new user account',
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

module.exports = UsersTest;
