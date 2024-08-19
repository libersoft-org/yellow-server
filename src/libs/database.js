const { Database: SQLiteDatabase } = require('bun:sqlite');
const Common = require('./common.js').Common;

class Database {
 constructor() {
  this.db = null;
 }

 async open() {
  try {
   this.db = new SQLiteDatabase(Common.appPath + Common.settings.other.db_file);
   return true;
  } catch (ex) {
   Common.addLog('Cannot open the database.', 2);
   Common.addLog(ex, 2);
   return false;
  }
 }

 async close() {
  if (!this.db) {
   Common.addLog('Cannot close the database as it is not opened.', 2);
   return false;
  }
  try {
   await this.db.close();
   this.db = null;
   return true;
  } catch (ex) {
   Common.addLog('Error closing the database.', 2);
   Common.addLog(ex, 2);
   return false;
  }
 }

 async read(query, params = []) {
  this.open();
  let res = null;
  try {
   res = this.db.prepare(query).all(params);
  } catch (ex) {
   Common.addLog(ex, 2);
  }
  this.close();
  return res;
 }

 async write(query, params = []) {
  this.open();
  let res = false;
  try {
   await this.db.run(query, ...params);
   res = true;
  } catch (ex) {
   Common.addLog(ex, 2);
  }
  this.close();
  return res;
 }

 async tableExists(name) {
  this.open();
  let res = null;
  try {
   const result = await this.db.prepare('SELECT COUNT(*) AS cnt FROM sqlite_master WHERE type = "table" AND name = ?').all([name]);
   res = result[0].cnt === 1;
  } catch (ex) {
   Common.addLog(ex, 2);
  }
  this.close();
  return res;
 }
}

module.exports = Database;
