/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */

const NempModuleInstall = require('../../main-module/nemp-module-install');

class ExampleInstall extends NempModuleInstall {
  constructor() {
    super();
    this.dbPreparations = [
      // Here add sql command for create demo table in db with one record
      // this record will be used in data.js;
    ];
  }
}

module.exports = ExampleInstall;
