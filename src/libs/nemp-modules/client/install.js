const NempModuleInstall = require('../../main-module/nemp-module-install');

class ClientInstall extends NempModuleInstall {
  constructor() {
    super();
    this.dbPreparations = [
    ];
  }
}

module.exports = ClientInstall;
