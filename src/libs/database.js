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
      this.logger.error(`[DB][READ] ${error.message}`);
    }
  }

  async write(query, params = []) {
    try {
      await this.open();
      await this.db.run(query, params, (err) => {
        if (err) {
          throw new Error(err.message);
        }
      });
      this.close();
    } catch (err) {
      this.logger.error(`[DB][WRITE] ${err.message}`);
      return {
        error: err,
      };
    }
  }

  async delete(query, params = []) {
    try {
      await this.open();
      await this.db.run(query, params, (err) => {
        if (err) {
          throw new Error(err.message);
        }
      });
      this.close();
    } catch (err) {
      this.logger.error(`[DB][DELETE] ${err.message}`);
      return {
        error: err,
      };
    }
  }

  async tableExists(name) {
    try {
      return (await this.read(`SELECT COUNT(*) AS cnt FROM sqlite_master WHERE type = "table" AND name = "${name}"`))[0].cnt == 1;
    } catch (error) {
      this.logger.error(`[DB][TABLEEXIST] ${error.message}`);
    }
  }
}

module.exports = Database;
