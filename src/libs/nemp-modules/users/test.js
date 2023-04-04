const NempModuleTest = require('../../main-module/nemp-module-test');

class UsersTest extends NempModuleTest {
  constructor() {
    super();
    this.tests = [
      {
        desc: 'Create new user account',
        command: '',
        data: {
          user: 'test',
          pass: '12345',
          firstname: 'Jakub',
          lastname: 'Test',
          phone: '123456',
          birth: '1.1.2111',
          gender: 'unicorn',
        },
      },
    ];
  }
}

module.exports = UsersTest;
