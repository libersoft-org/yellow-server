/* original file / database_sqllite.js */

const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const Logger = require('./utils/logger');
const Settings = require('./settings');

class Database {
  constructor() {
    this.logger = new Logger();
    this.dbFilePath = new Settings().getOne('db_file');
    this.db = null;
  }

  async open() {
    this.db = await sqlite.open({ filename: this.dbFilePath, driver: sqlite3.Database });
  }

  close() {
    this.db.close();
  }

  async read(query, params = []) {
    try {
      await this.open();
      const res = await this.db.all(query, params, (err, success) => {
        if (err) throw new Error(err);
      });
      this.close();
      return res;
    } catch (error) {
      this.logger.error(`[Database][read] error ${error.message}`);
    }
  }

  async write(query, params = []) {
    try {
      await this.open();
      await this.db.run(query, params, (err, success) => {
        if (err) throw new Error(err);
      });
      this.close();
    } catch (error) {
      this.logger.error(`[Database][write] error ${error.message}`);
    }
  }

  async tableExists(name) {
    try {
      return (await this.read(`SELECT COUNT(*) AS cnt FROM sqlite_master WHERE type = "table" AND name = "${name}"`))[0].cnt == 1;
    } catch (error) {
      this.logger.error(`[Database][tableExists] error ${error.message}`);
    }
  }
}

module.exports = Database;
