const Database = require('../database');
const Settings = require('../settings');

class NempModuleData {
  constructor() {
    this.db = new Database();
    this.settings = new Settings();
  }
}

module.exports = NempModuleData;
