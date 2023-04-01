/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */

const NempModule = require('../../main-module/nemp-module');
const Response = require('../../response');
const ExampleData = require('./data');

class Example extends NempModule {
  constructor() {
    super();
    this.moduleName = 'Example';
    this.moduleVersion = '1.0.0';
    this.data = new ExampleData();
    this.commands = {
      example_hello_world: {
        auth: 'public',
        run: this.getHelloWorld.bind(this),
      },
    };

    this.logger.log(this.getModuleInfo());
  }

  getHelloWorld(command) {
    this.logger.log(`[Module ${this.moduleName}] run command ${command}`);
    const data = { hello: 'world' };
    return Response.sendData(command, data);
  }
}

module.exports = Example;
