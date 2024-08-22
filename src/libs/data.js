import Argon2 from 'argon2';
import Crypto from 'crypto';
import Database from './database.js';
import { Common } from './common.js';

class Data {
 constructor() {
  this.db = new Database();
 }

 async createDB() {
  try {
   await this.db.write('CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR(32) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
   await this.db.write('CREATE TABLE IF NOT EXISTS admins_logins (id INTEGER PRIMARY KEY AUTOINCREMENT, id_admins INTEGER, session VARCHAR(128) NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_admins) REFERENCES admins(id))');
   await this.db.write('CREATE TABLE IF NOT EXISTS admins_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, id_admins INTEGER, session VARCHAR(255) NOT NULL UNIQUE, last TIMESTAMP DEFAULT CURRENT_TIMESTAMP, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_admins) REFERENCES admins(id))');
   await this.db.write('CREATE TABLE IF NOT EXISTS domains (id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR(255) NOT NULL UNIQUE, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
   await this.db.write('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, id_domains INTEGER, name VARCHAR(64) NOT NULL UNIQUE, visible_name VARCHAR(255) NULL, password VARCHAR(255) NOT NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_domains) REFERENCES domains(id), UNIQUE (name, id_domains))');
   await this.db.write('CREATE TABLE IF NOT EXISTS users_logins (id INTEGER PRIMARY KEY AUTOINCREMENT, id_users INTEGER, session VARCHAR(128) NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_users) REFERENCES users(id))');
   await this.db.write('CREATE TABLE IF NOT EXISTS users_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, id_users INTEGER, session VARCHAR(255) NOT NULL UNIQUE, last TIMESTAMP DEFAULT CURRENT_TIMESTAMP, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_users) REFERENCES users(id))');
   await this.db.write('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, id_users INTEGER, recipient VARCHAR(255) NOT NULL, message TEXT NOT NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_users) REFERENCES users(id))');
  } catch (ex) {
   Common.addLog(ex);
   process.exit(1);
  }
 }
 async adminCheckSession(sessionID) {
  return {};
 }

 async adminLogin(username, password) {
  if (!username) return { error: 1, message: 'Username is missing' };
  username = username.toLowerCase();
  const res = await this.db.read('SELECT id, username, password FROM admins WHERE username = ?', [username]);
  if (res.length !== 1) return { error: 2, message: 'Wrong username' };
  if (!(await this.verifyHash(res[0].password, password))) return { error: 3, message: 'Wrong password' };
  const session = this.getSessionID();
  await this.db.write('INSERT INTO admins_logins (id_admins, session) VALUES (?, ?)', [res[0].id, session]);
  await this.db.write('INSERT INTO admins_sessions (id_admins, session) VALUES (?, ?)', [res[0].id, session]);
  return { error: 0, data: { session } };
 }

 async adminLogout(sessionID) {
  await this.db.write('DELETE FROM admins_sessions WHERE session = ?', [sessionID]);
  return true;
 }

 async adminCheckSession(sessionID) {
  let res = await this.db.read('SELECT id FROM admins_sessions WHERE session = ?', [sessionID]);
  return res.length === 1 ? true : false;
 }

 async adminDeleteSession(sessionID) {
  return await this.db.write('DELETE FROM admins_login WHERE token = $1', [sessionID]);
 }

 async adminUpdateSessionTime(sessionID) {
  return await this.db.write('UPDATE admins_login SET updated = $1 WHERE token = $2', [Common.getDateTime(new Date()), sessionID]);
 }

 async adminGetAdmins() {
  return await this.db.read('SELECT id, user, created FROM admins');
 }

 async adminAddAdmin(username, password) {
  username = username.toLowerCase();
  if (username.length < 3 || username.length > 16 || !/^(?!.*[_.-]{2})[a-z0-9]+([_.-]?[a-z0-9]+)*$/.test(username)) return { error: 1, message: 'Invalid username. Username must be 3-16 characters long, can contain only English alphabet letters, numbers, and special characters (_ . -), but not at the beginning, end, or two in a row' };
  if (password.length < 8) return { error: 2, message: 'Password has to be 8 or more characters long' };
  await this.db.write('INSERT INTO admins (username, password) VALUES (?, ?)', [username, await this.getHash(password)]);
  return { error: 0, data: { message: 'Admin was created successfully' } };
 }

 async adminSetAdmin(id, user, pass) {
  return await this.db.write('UPDATE admins SET user = $1, pass = $2 WHERE id = $3', [user, pass != '' ? ', pass = "' + pass + '"' : '', id]);
 }

 async adminDelAdmin(id) {
  return await this.db.write('DELETE FROM admins WHERE id = $1', [id]);
 }

 async userLogin(address, password) {
  let [username, domain] = address.split('@');
  if (!username || !domain) return { error: 1, message: 'Invalid username format' };
  username = username.toLowerCase();
  domain = domain.toLowerCase();
  const res = await this.db.read('SELECT id FROM domains WHERE name = ?', [domain]);
  if (res.length !== 1) return { error: 2, message: 'Domain name not found on this server' };
  const res2 = await this.db.read('SELECT id, username, password FROM users WHERE username = ? AND id_domains = ?', [username, res[0].id]);
  if (res2.length !== 1) return { error: 3, message: 'Wrong username' };
  if (!(await this.verifyHash(res2[0].password, password))) return { error: 4, message: 'Wrong password' };
  const session = this.getSessionID();
  await this.db.write('INSERT INTO users_logins (id_users, session) VALUES (?, ?)', [res[0].id, session]);
  await this.db.write('INSERT INTO users_sessions (id_users, session) VALUES (?, ?)', [res[0].id, session]);
  return { error: 0, data: { session } };
 }

 getSessionID(len) {
  return Crypto.randomBytes(16).toString('hex') + Date.now().toString(16);
 }

 async getHash(password, memoryCost = 2 ** 16, hashLength = 64, timeCost = 20, parallelism = 1) {
  // default: 64 MB RAM, 64 characters length, 20 difficulty to calculate, 1 thread needed
  return await Argon2.hash(password, { memoryCost: memoryCost, hashLength: hashLength, timeCost: timeCost, parallelism: parallelism });
 }

 async verifyHash(hash, password) {
  return await Argon2.verify(hash, password);
 }
}

export default Data;
