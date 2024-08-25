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
   await this.db.write('CREATE TABLE IF NOT EXISTS domains (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(255) NOT NULL UNIQUE, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
   await this.db.write('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR(64) NOT NULL, id_domains INTEGER, visible_name VARCHAR(255) NULL, password VARCHAR(255) NOT NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_domains) REFERENCES domains(id), UNIQUE (username, id_domains))');
   await this.db.write('CREATE TABLE IF NOT EXISTS users_logins (id INTEGER PRIMARY KEY AUTOINCREMENT, id_users INTEGER, session VARCHAR(128) NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_users) REFERENCES users(id))');
   await this.db.write('CREATE TABLE IF NOT EXISTS users_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, id_users INTEGER, session VARCHAR(255) NOT NULL UNIQUE, last TIMESTAMP DEFAULT CURRENT_TIMESTAMP, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_users) REFERENCES users(id))');
   await this.db.write('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, id_users INTEGER, recipient VARCHAR(255) NOT NULL, message TEXT NOT NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_users) REFERENCES users(id))');
  } catch (ex) {
   Common.addLog(ex);
   process.exit(1);
  }
 }

 async getAdminCredentials(username) {
  const res = await this.db.read('SELECT id, username, password FROM admins WHERE username = ?', [username]);
  return res.length === 1 ? res[0] : false;
 }

 async adminSetLogin(adminID, sessionID) {
  await this.db.write('INSERT INTO admins_logins (id_admins, session) VALUES (?, ?)', [adminID, sessionID]);
  await this.db.write('INSERT INTO admins_sessions (id_admins, session) VALUES (?, ?)', [adminID, sessionID]);
 }

 async adminCheckSession(sessionID) {
  const res = await this.db.read('SELECT id FROM admins_sessions WHERE session = ?', [sessionID]);
  return res.length === 1 ? true : false;
 }

 async getAdminIDBySession(sessionID) {
  const res = await this.db.read('SELECT id_admins FROM admins_sessions WHERE session = ?', [sessionID]);
  return res.length === 1 ? res[0].id_admins : false;
 }

 async adminListSessions(adminID, count = 10, offset = 0) {
  const res = await this.db.read('SELECT session, last, created FROM admins_sessions WHERE id_admins = ? LIMIT ? OFFSET ?', [adminID, count, offset]);
  return res.length > 0 ? res : false;
 }

 async adminDelSession(adminID, sessionID) {
  await this.db.write('DELETE FROM admins_sessions WHERE id_admins = ? AND session = ?', [adminID, sessionID]);
 }

 async sessionExists(adminID, sessionID) {
  const res = await this.db.read('SELECT session FROM admins_sessions WHERE id_admins = ? AND session = ?', [adminID, sessionID]);
  return res.length === 1 ? true : false;
 }

 async adminUpdateSessionTime(sessionID) {
  return await this.db.write('UPDATE admins_sessions SET last = CURRENT_TIMESTAMP WHERE session = ?', [sessionID]);
 }

 async adminListAdmins(count = 10, offset = 0) {
  const res = await this.db.read('SELECT id, username, created FROM admins LIMIT ? OFFSET ?', [count, offset]);
  return res.length > 0 ? res : false;
 }

 async adminAddAdmin(username, passwordHash) {
  await this.db.write('INSERT INTO admins (username, password) VALUES (?, ?)', [username, passwordHash]);
 }

 async adminExistsByID(adminID) {
  const res = await this.db.read('SELECT id FROM admins WHERE id = ?', [adminID]);
  return res.length === 1 ? true : false;
 }

 async adminExistsByUsername(username) {
  const res = await this.db.read('SELECT id FROM admins WHERE username = ?', [username]);
  return res.length === 1 ? true : false;
 }

 async adminEditAdmin(id, username, passwordHash) {
  // TODO
 }

 async adminDelAdmin(id) {
  await this.db.write('DELETE FROM admins_logins WHERE id_admins = ?', [id]);
  await this.db.write('DELETE FROM admins_sessions WHERE id_admins = ?', [id]);
  await this.db.write('DELETE FROM admins WHERE id = ?', [id]);
 }

 async adminListDomains(count = 10, offset = 0) {
  const res = await this.db.read('SELECT id, name, created FROM domains LIMIT ? OFFSET ?', [count, offset]);
  return res.length > 0 ? res : false;
 }

 async adminAddDomain(name) {
  await this.db.write('INSERT INTO domains (name) VALUES (?)', [name]);
 }

 async domainExistsByID(domainID) {
  const res = await this.db.read('SELECT id FROM domains WHERE id = ?', [domainID]);
  return res.length === 1 ? true : false;
 }

 async domainExistsByName(name) {
  const res = await this.db.read('SELECT id FROM domains WHERE name = ?', [name]);
  return res.length === 1 ? true : false;
 }

 async adminEditDomain(id, name) {
  // TODO
 }

 async adminDelDomain(id) {
  await this.db.write('DELETE FROM domains WHERE id = ?', [id]);
 }

 async adminListUsers(count = 10, offset = 0) {
  const res = await this.db.read('SELECT id, username, id_domains, visible_name, created FROM users LIMIT ? OFFSET ?', [count, offset]);
  return res.length > 0 ? res : false;
 }

 async adminAddUser(username, domainID, visible_name, passwordHash) {
  await this.db.write('INSERT INTO users (username, id_domains, visible_name, password) VALUES (?, ?, ?, ?)', [username, domainID, visible_name, passwordHash]);
 }

 async userExistsByID(userID) {
  const res = await this.db.read('SELECT id FROM users WHERE id = ?', [userID]);
  return res.length === 1 ? true : false;
 }

 async userExistsByUserNameAndDomain(username, domainID) {
  const res = await this.db.read('SELECT id FROM users WHERE username = ? AND id_domains = ?', [username, domainID]);
  return res.length === 1 ? true : false;
 }

 async adminEditUser(id, username, domainID, visible_name, passwordHash) {
  // TODO
 }

 async adminDelUser(id) {
  await this.db.write('DELETE FROM users WHERE id = ?', [id]);
 }

 async getUserCredentials(username, domainID) {
  const res = await this.db.read('SELECT id, username, password FROM users WHERE username = ? AND id_domains = ?', [username, domainID]);
  return res.length === 1 ? res[0] : false;
 }

 async userSetLogin(userID, sessionID) {
  await this.db.write('INSERT INTO users_logins (id_users, session) VALUES (?, ?)', [userID, sessionID]);
  await this.db.write('INSERT INTO users_sessions (id_users, session) VALUES (?, ?)', [userID, sessionID]);
 }

 async userCheckSession(sessionID) {
  const res = await this.db.read('SELECT id FROM users_sessions WHERE session = ?', [sessionID]);
  return res.length === 1 ? true : false;
 }

 async getDomainID(domain) {
  const res = await this.db.read('SELECT id FROM domains WHERE name = ?', [domain]);
  return res.length === 1 ? res[0].id : false;
 }

 async userDelSession(sessionID) {
  await this.db.write('DELETE FROM admins_sessions WHERE session = ?', [sessionID]);
  return true;
 }

 async userUpdateSessionTime(sessionID) {
  return await this.db.write('UPDATE users_sessions SET last = CURRENT_TIMESTAMP WHERE session = ?', [sessionID]);
 }
}

export default Data;
