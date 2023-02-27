const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const Common = require('../common.js').Common;

class Database {
 async open() {
  this.db = await sqlite.open({filename: Common.settings.db_file, driver: sqlite3.Database});
 }

 close() {
  this.db.close();
 }

 async read(query, params=[]) {
  try {
   await this.open();
   var res = await this.db.all(query, params, (err, success) => {
    if(err) throw new Error(err);
   });
   this.close();
   return res;
  } catch (ex) {
   Common.addLog(ex);
  }
 }

 async write(query, params=[]) {
  try {
   await this.open();
   await this.db.run(query, params, (err, success) => {
    if(err) throw new Error(err);
   });
   this.close();
  } catch (ex) {
   Common.addLog(ex);
  }
 }

 async tableExists(name) {
  try {
   return (await this.read('SELECT COUNT(*) AS cnt FROM sqlite_master WHERE type = "table" AND name = "' + name + '"'))[0].cnt == 1 ? true : false;
  } catch (ex) {
   Common.addLog(ex);
  }
 }
}

module.exports = Database;
