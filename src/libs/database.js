import { Database as SQLiteDatabase } from 'bun:sqlite';
import { Common } from './common.js';

class Database {
 constructor() {
  this.dbFile = Common.appPath + Common.settings.other.db_file;
 }

 execute(callback) {
  try {
   using db = new SQLiteDatabase(this.dbFile);
   return callback(db);
  } catch (ex) {
   Common.addLog(ex.message, 2);
   return null;
  }
 }

 query(command, params = []) {
  return this.execute(db => {
   if (command.trim().toUpperCase().startsWith('SELECT')) return db.query(command).all(params);
   else return db.run(command, ...params);
  });
 }

 async databaseExists() {
  return await Bun.file(this.dbFile).exists();
 }

 tableExists(name) {
  return this.execute(db => {
   const result = db.query('SELECT COUNT(*) AS cnt FROM sqlite_master WHERE type = "table" AND name = ?').all([name]);
   return result[0].cnt === 1;
  });
 }
}

export default Database;
