const Database = require('../db/database');

class NempModuleData {
  constructor() {
    this.db = new Database();
  }
}

module.exports = NempModuleData;
