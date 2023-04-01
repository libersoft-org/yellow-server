const fs = require('fs');
const Logger = require('./utils/logger');

class Settings {
  constructor() {
    this.logger = new Logger();
    this.settingsFile = 'settings.json';
    this.settings = null;

    this.load();
  }

  load() {
    if (fs.existsSync(this.settingsFile)) {
      try {
        this.settings = JSON.parse(fs.readFileSync(this.settingsFile, { encoding: 'utf8', flag: 'r' }));
      } catch (error) {
        Logger.logWithoutWriteToFile(`[Settings] Error lodad settings file "${this.settingsFile}" - ${error.message}`);
      }
    } else {
      Logger.logWithoutWriteToFile(`[Settings] Error: Settings file "${this.settingsFile}" not found.`);
      process.exit(1);
    }
  }

  getAll() {
    return this.settings;
  }

  getOne(settingsKey) {
    if (!this.settings[settingsKey]) {
      this.logger.error(`[Settings] no data for setting "${settingsKey}"`);
      return null;
    }

    return this.settings[settingsKey];
  }
}

module.exports = Settings;
