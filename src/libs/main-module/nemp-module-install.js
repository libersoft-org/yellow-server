const Database = require('../database');
const Logger = require('../utils/logger');

class NempModuleInstall {
  constructor() {
    this.db = new Database();
    this.logger = new Logger();
    this.moduleName = null;
    this.dbPreparations = [];
  }

  async run() {
    if (this.dbPreparations.length > 0) {
      try {
        // eslint-disable-next-line no-restricted-syntax
        for (const dbCommand of this.dbPreparations) {
          // eslint-disable-next-line no-await-in-loop
          await this.db.write(dbCommand);
        }
      } catch (error) {
        this.logger.error(`[Module ${this.moduleName}][Installation] Error ${error.message}`);
      }
    } else {
      this.logger.log(`[Module ${this.moduleName}][Installation] no commands for db preparation`);
    }
  }

  /* not implemented now
  checkDependencies() {
  }
  */
}

module.exports = NempModuleInstall;
