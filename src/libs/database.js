import mariaDB from 'mariadb';
import { Common } from './common.js';

class Database {
 constructor() {
  this.connectionConfig = {
   host: Common.settings.database.host,
   port: Common.settings.database.port,
   user: Common.settings.database.user,
   password: Common.settings.database.password,
   database: Common.settings.database.name,
   bigIntAsNumber: true
  };
  this.conn = null;
  this.connecting = false;
 }

 async connect() {
   this.conn = await mariaDB.createConnection(this.connectionConfig);
   Common.addLog('Connected to the database');
 }

 async reconnect() {
  if (this.conn) {
   try {
    await this.conn.end();
   } catch (ex) {
    Common.addLog('Error while disconnecting: ' + ex.message, 2);
   }
  }
  this.conn = null;
  await this.connect();
 }

 async execute(callback) {

  Common.addLog('db.execute');

  try {
   if (!this.conn)
   {
    await this.connect();
    Common.addLog('Connected: ' + JSON.stringify(this.conn));
   }
   else {
    try {
     await this.conn.ping();
    } catch (err) {
     Common.addLog('Connection lost: ' + err.message, 2);
     await this.reconnect();
     Common.addLog('Reconnected: ' + JSON.stringify(this.conn));
    }
   }
   Common.addLog('callback: ' + callback);
   const result = await callback(this.conn);
   Common.addLog('result: ' + JSON.stringify(result));
   return result;
  } catch (ex) {
   Common.addLog(ex.message, 2);
   return null;
  }
 }

 async query(command, params = []) {
  Common.addLog('query: ' + command + ' ' + params);
  return await this.execute(async conn => {
   Common.addLog('conn: ' + JSON.stringify(conn));
   const result = await conn.query(command, params);
   return result;
  });
 }

 async databaseExists() {
  return await this.execute(async conn => {
   const rows = await conn.query('SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?', [Common.settings.database.name]);
   return rows.length > 0;
  });
 }

 async tableExists(name) {
  return await this.execute(async conn => {
   const rows = await conn.query('SELECT COUNT(*) AS cnt FROM information_schema.tables WHERE table_schema = ? AND table_name = ?', [Common.settings.database.name, name]);
   return rows[0].cnt === 1;
  });
 }
}

export default Database;
