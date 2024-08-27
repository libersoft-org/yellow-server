import Database from './database.js';
import { Common } from './common.js';

class Data {
 constructor() {
  this.db = new Database();
 }

 databaseExists() {
  return this.db.databaseExists();
 }

 createDB() {
  try {
   this.db.query('CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR(32) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
   this.db.query('CREATE TABLE IF NOT EXISTS admins_logins (id INTEGER PRIMARY KEY AUTOINCREMENT, id_admins INTEGER, session VARCHAR(128) NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_admins) REFERENCES admins(id))');
   this.db.query('CREATE TABLE IF NOT EXISTS admins_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, id_admins INTEGER, session VARCHAR(255) NOT NULL UNIQUE, last TIMESTAMP DEFAULT CURRENT_TIMESTAMP, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_admins) REFERENCES admins(id))');
   this.db.query('CREATE TABLE IF NOT EXISTS domains (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(255) NOT NULL UNIQUE, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
   this.db.query('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR(64) NOT NULL, id_domains INTEGER, visible_name VARCHAR(255) NULL, password VARCHAR(255) NOT NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_domains) REFERENCES domains(id), UNIQUE (username, id_domains))');
   this.db.query('CREATE TABLE IF NOT EXISTS users_logins (id INTEGER PRIMARY KEY AUTOINCREMENT, id_users INTEGER, session VARCHAR(128) NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_users) REFERENCES users(id))');
   this.db.query('CREATE TABLE IF NOT EXISTS users_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, id_users INTEGER, session VARCHAR(255) NOT NULL UNIQUE, last TIMESTAMP DEFAULT CURRENT_TIMESTAMP, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_users) REFERENCES users(id))');
   this.db.query('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, id_users INTEGER, address_from VARCHAR(255) NOT NULL, address_to VARCHAR(255) NOT NULL, message TEXT NOT NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_users) REFERENCES users(id))');
  } catch (ex) {
   Common.addLog(ex);
   process.exit(1);
  }
 }

 getAdminCredentials(username) {
  const res = this.db.query('SELECT id, username, password FROM admins WHERE username = ?', [username]);
  return res.length === 1 ? res[0] : false;
 }

 adminDelOldSessions() {
  return this.db.query('DELETE FROM admins_sessions WHERE last <= DATETIME("now", ?)', [`-${Common.settings.other.session_admin} SECONDS`]);
 }

 adminSetLogin(adminID, sessionID) {
  this.db.query('INSERT INTO admins_logins (id_admins, session) VALUES (?, ?)', [adminID, sessionID]);
  this.db.query('INSERT INTO admins_sessions (id_admins, session) VALUES (?, ?)', [adminID, sessionID]);
 }

 adminCheckSession(sessionID) {
  const res = this.db.query('SELECT id FROM admins_sessions WHERE session = ?', [sessionID]);
  return res.length === 1 ? true : false;
 }

 getAdminIDBySession(sessionID) {
  const res = this.db.query('SELECT id_admins FROM admins_sessions WHERE session = ?', [sessionID]);
  return res.length === 1 ? res[0].id_admins : false;
 }

 adminListSessions(adminID, count = 10, offset = 0) {
  const res = this.db.query('SELECT session, last, created FROM admins_sessions WHERE id_admins = ? LIMIT ? OFFSET ?', [adminID, count, offset]);
  return res.length > 0 ? res : false;
 }

 adminDelSession(adminID, sessionID) {
  this.db.query('DELETE FROM admins_sessions WHERE id_admins = ? AND session = ?', [adminID, sessionID]);
 }

 adminSessionExists(adminID, sessionID) {
  const res = this.db.query('SELECT session FROM admins_sessions WHERE id_admins = ? AND session = ?', [adminID, sessionID]);
  return res.length === 1 ? true : false;
 }

 adminSessionExpired(sessionID) {
  const res = this.db.query('SELECT (strftime("%s", "now") - strftime("%s", last)) > ? AS expired FROM admins_sessions WHERE session = ?', [Common.settings.other.session_admin, sessionID]);
  return res[0].expired === 1 ? true : false;
 }

 adminUpdateSessionTime(sessionID) {
  return this.db.query('UPDATE admins_sessions SET last = CURRENT_TIMESTAMP WHERE session = ?', [sessionID]);
 }

 adminListAdmins(count = 10, offset = 0) {
  const res = this.db.query('SELECT id, username, created FROM admins LIMIT ? OFFSET ?', [count, offset]);
  return res.length > 0 ? res : false;
 }

 adminAddAdmin(username, password) {
  this.db.query('INSERT INTO admins (username, password) VALUES (?, ?)', [username, this.getHash(password)]);
 }

 adminExistsByID(adminID) {
  const res = this.db.query('SELECT id FROM admins WHERE id = ?', [adminID]);
  return res.length === 1 ? true : false;
 }

 adminExistsByUsername(username) {
  const res = this.db.query('SELECT id FROM admins WHERE username = ?', [username]);
  return res.length === 1 ? true : false;
 }

 adminEditAdmin(id, username, password) {
  // TODO
 }

 adminDelAdmin(id) {
  this.db.query('DELETE FROM admins_logins WHERE id_admins = ?', [id]);
  this.db.query('DELETE FROM admins_sessions WHERE id_admins = ?', [id]);
  this.db.query('DELETE FROM admins WHERE id = ?', [id]);
 }

 adminListDomains(count = 10, offset = 0) {
  const res = this.db.query('SELECT id, name, created FROM domains LIMIT ? OFFSET ?', [count, offset]);
  return res.length > 0 ? res : false;
 }

 adminAddDomain(name) {
  this.db.query('INSERT INTO domains (name) VALUES (?)', [name]);
 }

 domainExistsByID(domainID) {
  const res = this.db.query('SELECT id FROM domains WHERE id = ?', [domainID]);
  return res.length === 1 ? true : false;
 }

 domainExistsByName(name) {
  const res = this.db.query('SELECT id FROM domains WHERE name = ?', [name]);
  return res.length === 1 ? true : false;
 }

 adminEditDomain(id, name) {
  // TODO
 }

 adminDelDomain(id) {
  this.db.query('DELETE FROM domains WHERE id = ?', [id]);
 }

 adminListUsers(domainID, count = 10, offset = 0) {
  const res = this.db.query('SELECT id, username, id_domains, visible_name, created FROM users WHERE id_domains = ? LIMIT ? OFFSET ?', [domainID, count, offset]);
  return res.length > 0 ? res : false;
 }

 adminCountUsers(domainID) {
  const res = this.db.query('SELECT id FROM users WHERE id_domains = ?', [domainID]);
  return res.length;
 }

 adminAddUser(username, domainID, visible_name, password) {
  this.db.query('INSERT INTO users (username, id_domains, visible_name, password) VALUES (?, ?, ?, ?)', [username, domainID, visible_name, this.getHash(password)]);
 }

 userDelOldSessions() {
  return this.db.query('DELETE FROM users_sessions WHERE last <= DATETIME("now", ?)', [`-${Common.settings.other.session_user} SECONDS`]);
 }

 userExistsByID(userID) {
  const res = this.db.query('SELECT id FROM users WHERE id = ?', [userID]);
  return res.length === 1 ? true : false;
 }

 userExistsByUserNameAndDomain(username, domainID) {
  const res = this.db.query('SELECT id FROM users WHERE username = ? AND id_domains = ?', [username, domainID]);
  return res.length === 1 ? true : false;
 }

 adminEditUser(id, username, domainID, visible_name, password) {
  // TODO
 }

 adminDelUser(id) {
  this.db.query('DELETE FROM users_sessions WHERE id_users = ?', [id]);
  this.db.query('DELETE FROM users_logins WHERE id_users = ?', [id]);
  this.db.query('DELETE FROM users WHERE id = ?', [id]);
 }

 getUserCredentials(username, domainID) {
  const res = this.db.query('SELECT id, username, password FROM users WHERE username = ? AND id_domains = ?', [username, domainID]);
  return res.length === 1 ? res[0] : false;
 }

 userSetLogin(userID, sessionID) {
  this.db.query('INSERT INTO users_logins (id_users, session) VALUES (?, ?)', [userID, sessionID]);
  this.db.query('INSERT INTO users_sessions (id_users, session) VALUES (?, ?)', [userID, sessionID]);
 }

 userCheckSession(sessionID) {
  const res = this.db.query('SELECT id FROM users_sessions WHERE session = ?', [sessionID]);
  return res.length === 1 ? true : false;
 }

 getUserIDBySession(sessionID) {
  const res = this.db.query('SELECT id_users FROM users_sessions WHERE session = ?', [sessionID]);
  return res.length === 1 ? res[0].id_users : false;
 }

 userListSessions(userID, count = 10, offset = 0) {
  const res = this.db.query('SELECT session, last, created FROM users_sessions WHERE id_users = ? LIMIT ? OFFSET ?', [userID, count, offset]);
  return res.length > 0 ? res : false;
 }

 getDomainIDByName(domain) {
  const res = this.db.query('SELECT id FROM domains WHERE name = ?', [domain]);
  return res.length === 1 ? res[0].id : false;
 }

 getDomainNameByID(domainID) {
  const res = this.db.query('SELECT name FROM domains WHERE id = ?', [domainID]);
  return res.length === 1 ? res[0].name : false;
 }

 userDelSession(userID, sessionID) {
  this.db.query('DELETE FROM users_sessions WHERE id_users = ? AND session = ?', [userID, sessionID]);
 }

 userSessionExists(userID, sessionID) {
  const res = this.db.query('SELECT session FROM users_sessions WHERE id_users = ? AND session = ?', [userID, sessionID]);
  return res.length === 1 ? true : false;
 }

 userSessionExpired(sessionID) {
  const res = this.db.query('SELECT (strftime("%s", "now") - strftime("%s", last)) > ? AS expired FROM users_sessions WHERE session = ?', [Common.settings.other.session_user, sessionID]);
  return res[0].expired === 1 ? true : false;
 }

 userUpdateSessionTime(sessionID) {
  return this.db.query('UPDATE users_sessions SET last = CURRENT_TIMESTAMP WHERE session = ?', [sessionID]);
 }

 getUserIDByUsernameAndDomainID(username, domainID) {
  const res = this.db.query('SELECT id FROM users WHERE username = ? AND id_domains = ?', [username, domainID]);
  return res.length === 1 ? res[0].id : false;
 }

 userGetUserInfo(userID) {
  const res = this.db.query('SELECT id, username, id_domains, visible_name FROM users WHERE id = ?', [userID]);
  return res.length === 1 ? res[0] : false;
 }

 userSendMessage(userID, address_from, address_to, message) {
  this.db.query('INSERT INTO messages (id_users, address_from, address_to, message) VALUES (?, ?, ?, ?)', [userID, address_from, address_to, message]);
 }

 userListMessages(userID, address, count = 10, offset = 0) {
  const res = this.db.query('SELECT id, address_from, address_to, message, created FROM messages WHERE id_users = ? AND (address_from = ? OR address_to = ?) ORDER BY id DESC LIMIT ? OFFSET ?', [userID, address, address, count, offset]);
  return res.length > 0 ? res : false;
 }

 getHash(password, memoryCost = 65536, hashLength = 64, timeCost = 20, parallelism = 1) {
  // default: 64 MB RAM, 64 characters length, 20 difficulty to calculate, 1 thread needed
  return Bun.password.hashSync(password, { algorithm: 'argon2id', memoryCost, hashLength, timeCost, parallelism });
 }

 verifyHash(hash, password) {
  return Bun.password.verifySync(password, hash);
 }
}

export default Data;
