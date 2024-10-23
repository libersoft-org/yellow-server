import { Database, Log } from 'yellow-server-common';
import { Info } from './info.js';

class Data {
 constructor() {
  this.db = new Database(Info.settings.database);
 }

 async close()
 {
  await this.db.disconnect();
 }

 async databaseExists() {
  return await this.db.databaseExists();
 }

 async createDB() {
  try {
   await this.db.query('CREATE TABLE IF NOT EXISTS admins (id INT PRIMARY KEY AUTO_INCREMENT, username VARCHAR(32) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
   await this.db.query('CREATE TABLE IF NOT EXISTS admins_logins (id INT PRIMARY KEY AUTO_INCREMENT, id_admins INT, session VARCHAR(128) NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_admins) REFERENCES admins(id))');
   await this.db.query('CREATE TABLE IF NOT EXISTS admins_sessions (id INT PRIMARY KEY AUTO_INCREMENT, id_admins INT, session VARCHAR(255) NOT NULL UNIQUE, last TIMESTAMP DEFAULT CURRENT_TIMESTAMP, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_admins) REFERENCES admins(id))');
   await this.db.query('CREATE TABLE IF NOT EXISTS domains (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255) NOT NULL UNIQUE, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
   await this.db.query('CREATE TABLE IF NOT EXISTS users (id INT PRIMARY KEY AUTO_INCREMENT, username VARCHAR(64) NOT NULL, id_domains INT, visible_name VARCHAR(255) NULL, password VARCHAR(255) NOT NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_domains) REFERENCES domains(id), UNIQUE (username, id_domains))');
   await this.db.query('CREATE TABLE IF NOT EXISTS users_logins (id INT PRIMARY KEY AUTO_INCREMENT, id_users INT, session VARCHAR(128) NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_users) REFERENCES users(id))');
   await this.db.query('CREATE TABLE IF NOT EXISTS users_sessions (id INT PRIMARY KEY AUTO_INCREMENT, id_users INT, session VARCHAR(255) NOT NULL UNIQUE, last TIMESTAMP DEFAULT CURRENT_TIMESTAMP, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_users) REFERENCES users(id))');
   await this.db.query('CREATE TABLE IF NOT EXISTS modules (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255) NOT NULL UNIQUE, connection_string VARCHAR(255) NOT NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
  } catch (ex) {
   Log.error('createDB:', ex);
   process.exit(1);
  }
 }

 async getAdminCredentials(username) {
  const res = await this.db.query('SELECT id, username, password FROM admins WHERE username = ?', [username]);
  return res.length === 1 ? res[0] : false;
 }

 async adminDelOldSessions() {
  return await this.db.query('DELETE FROM admins_sessions WHERE last <= DATE_SUB(NOW(), INTERVAL ? SECOND)', [Info.settings.other.session_admin]);
 }

 async adminSetLogin(adminID, sessionID) {
  await this.db.query('INSERT INTO admins_logins (id_admins, session) VALUES (?, ?)', [adminID, sessionID]);
  await this.db.query('INSERT INTO admins_sessions (id_admins, session) VALUES (?, ?)', [adminID, sessionID]);
 }

 async adminSessionCheck(sessionID) {
  const res = await this.db.query('SELECT id FROM admins_sessions WHERE session = ?', [sessionID]);
  return res.length === 1 ? true : false;
 }

 async getAdminIDBySession(sessionID) {
  const res = await this.db.query('SELECT id_admins FROM admins_sessions WHERE session = ?', [sessionID]);
  return res.length === 1 ? res[0].id_admins : false;
 }

 async adminSessionsList(adminID, count = 10, offset = 0, orderBy = 'id', direction = 'ASC', filterName = null) {
  let query = 'SELECT id, session, last, created FROM admins_sessions WHERE id_admins = ?';
  const params = [adminID];
  if (filterName !== null) {
   query += ' AND session LIKE ?';
   params.push('%' + filterName + '%');
  }
  query += ' ORDER BY ' + orderBy + ' ' + direction;
  query += ' LIMIT ? OFFSET ?';
  params.push(count);
  params.push(offset);
  return await this.db.query(query, params);
 }

 async adminSessionsDel(adminID, sessionID) {
  await this.db.query('DELETE FROM admins_sessions WHERE id_admins = ? AND session = ?', [adminID, sessionID]);
 }

 async adminSessionExists(adminID, sessionID) {
  const res = await this.db.query('SELECT session FROM admins_sessions WHERE id_admins = ? AND session = ?', [adminID, sessionID]);
  return res.length === 1 ? true : false;
 }

 async adminSessionExpired(sessionID) {
  const res = await this.db.query('SELECT (UNIX_TIMESTAMP(NOW()) - UNIX_TIMESTAMP(last)) > ? AS expired FROM admins_sessions WHERE session = ?', [Info.settings.other.session_admin, sessionID]);
  return res[0].expired === 1 ? true : false;
 }

 async adminUpdateSessionTime(sessionID) {
  return await this.db.query('UPDATE admins_sessions SET last = CURRENT_TIMESTAMP WHERE session = ?', [sessionID]);
 }

 async adminAdminsList(count = 10, offset = 0, orderBy = 'id', direction = 'ASC', filterName = null) {
  let query = 'SELECT id, username, created FROM admins';
  const params = [];
  if (filterName !== null) {
   query += ' WHERE username LIKE ?';
   params.push('%' + filterName + '%');
  }
  query += ' ORDER BY ' + orderBy + ' ' + direction;
  query += ' LIMIT ? OFFSET ?';
  params.push(count);
  params.push(offset);
  return await this.db.query(query, params);
 }

 async adminAdminsAdd(username, password) {
  await this.db.query('INSERT INTO admins (username, password) VALUES (?, ?)', [username, this.getHash(password)]);
 }

 async adminExistsByID(adminID) {
  const res = await this.db.query('SELECT id FROM admins WHERE id = ?', [adminID]);
  return res.length === 1 ? true : false;
 }

 async adminExistsByUsername(username) {
  const res = await this.db.query('SELECT id FROM admins WHERE username = ?', [username]);
  return res.length === 1 ? true : false;
 }

 async adminAdminsEdit(id, username = null, password = null) {
  let query = 'UPDATE admins SET';
  let params = [];
  if (username) {
   query += ' username = ?,';
   params.push(username);
  }
  if (password) {
   query += ' password = ?';
   params.push(this.getHash(password));
  }
  if (query.endsWith(',')) query = query.slice(0, -1);
  query += ' WHERE id = ?';
  params.push(id);
  await this.db.query(query, params);
 }

 async adminAdminsDel(id) {
  await this.db.query('DELETE FROM admins_logins WHERE id_admins = ?', [id]);
  await this.db.query('DELETE FROM admins_sessions WHERE id_admins = ?', [id]);
  await this.db.query('DELETE FROM admins WHERE id = ?', [id]);
 }

 async getAdminInfoByID(adminID) {
  const res = await this.db.query('SELECT username, created FROM admins WHERE id = ?', [adminID]);
  return res.length === 1 ? res[0] : false;
 }

 async adminDomainsList(count = 10, offset = 0, orderBy = 'id', direction = 'ASC', filterName = null) {
  let query = 'SELECT d.id, d.name, COUNT(u.id) AS users_count, d.created FROM domains d LEFT JOIN users u ON u.id_domains = d.id';
  const params = [];
  if (filterName !== null) {
   query += ' WHERE d.name LIKE ?';
   params.push('%' + filterName + '%');
  }
  query += ' GROUP BY d.id';
  query += ' ORDER BY ' + (orderBy === 'users_count' ? orderBy : 'd.' + orderBy) + ' ' + direction;
  query += ' LIMIT ? OFFSET ?';
  params.push(count);
  params.push(offset);
  const res = await this.db.query(query, params);
  //console.log(res);
  return res;
 }

 async adminDomainsAdd(name) {
  await this.db.query('INSERT INTO domains (name) VALUES (?)', [name]);
 }

 async domainExistsByID(domainID) {
  const res = await this.db.query('SELECT id FROM domains WHERE id = ?', [domainID]);
  return res.length === 1 ? true : false;
 }

 async domainExistsByName(name) {
  const res = await this.db.query('SELECT id FROM domains WHERE name = ?', [name]);
  return res.length === 1 ? true : false;
 }

 async adminDomainsEdit(id, name) {
  await this.db.query('UPDATE domains SET name = ? WHERE id = ?', [name, id]);
 }

 async adminDomainsDel(id) {
  await this.db.query('DELETE FROM domains WHERE id = ?', [id]);
 }

 async adminUsersList(count = 10, offset = 0, orderBy = 'id', direction = 'ASC', filterUsername = null, filterDomainID = null) {
  let query = "SELECT u.id, CONCAT(u.username, '@', d.name) AS address, u.visible_name, u.created FROM users u JOIN domains d ON u.id_domains = d.id";
  const params = [];
  const conditions = [];
  if (filterUsername !== null) {
   conditions.push('u.username LIKE ?');
   params.push('%' + filterUsername + '%');
  }
  if (filterDomainID !== null) {
   conditions.push('u.id_domains = ?');
   params.push(filterDomainID);
  }
  if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
  direction = direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  query += ' ORDER BY ' + (orderBy === 'address' ? orderBy : 'u.' + orderBy) + ' ' + direction;
  query += ' LIMIT ? OFFSET ?';
  params.push(count, offset);
  return await this.db.query(query, params);
 }

 async adminUsersCount(domainID) {
  const res = await this.db.query('SELECT id FROM users WHERE id_domains = ?', [domainID]);
  return res.length;
 }

 async adminUsersAdd(username, domainID, visible_name, password) {
  await this.db.query('INSERT INTO users (username, id_domains, visible_name, password) VALUES (?, ?, ?, ?)', [username, domainID, visible_name, this.getHash(password)]);
 }

 async userDelOldSessions() {
  return await this.db.query('DELETE FROM users_sessions WHERE last <= DATE_SUB(NOW(), INTERVAL ? SECOND)', [Info.settings.other.session_user]);
 }

 async userExistsByID(userID) {
  const res = await this.db.query('SELECT id FROM users WHERE id = ?', [userID]);
  return res.length === 1 ? true : false;
 }

 async userExistsByUserNameAndDomain(username, domainID, excludeID) {
  let query = 'SELECT id FROM users WHERE username = ? AND id_domains = ?';
  let params = [username, domainID];
  if (excludeID !== undefined) {
   query += ' AND id != ?';
   params.push(excludeID);
  }
  const res = await this.db.query(query, params);
  return res.length === 1 ? true : false;
 }

 async adminUsersEdit(id, username, domainID, visible_name, password) {
  let query = 'UPDATE users SET';
  let params = [];
  if (username) {
   query += ' username = ?,';
   params.push(username);
  }
  if (domainID) {
   query += ' id_domains = ?,';
   params.push(domainID);
  }
  if (visible_name) {
   query += ' visible_name = ?,';
   params.push(visible_name);
  }
  if (password) {
   query += ' password = ?';
   params.push(this.getHash(password));
  }
  if (query.endsWith(',')) query = query.slice(0, -1);
  query += ' WHERE id = ?';
  params.push(id);
  await this.db.query(query, params);
 }

 async adminUsersDel(id) {
  await this.db.query('DELETE FROM users_sessions WHERE id_users = ?', [id]);
  await this.db.query('DELETE FROM users_logins WHERE id_users = ?', [id]);
  await this.db.query('DELETE FROM users WHERE id = ?', [id]);
 }

 async getUserInfoByID(userID) {
  const res = await this.db.query('SELECT username, id_domains, visible_name, created FROM users WHERE id = ?', [userID]);
  return res.length === 1 ? res[0] : false;
 }

 async getUserCredentials(username, domainID) {
  const res = await this.db.query('SELECT id, username, password FROM users WHERE username = ? AND id_domains = ?', [username, domainID]);
  return res.length === 1 ? res[0] : false;
 }

 async adminModulesList(count = 10, offset = 0, orderBy = 'id', direction = 'ASC', filterName = null) {
  let query = 'SELECT id, name, connection_string, created FROM modules';
  const params = [];
  if (filterName !== null) {
   query += ' WHERE name LIKE ?';
   params.push('%' + filterName + '%');
  }
  query += ' GROUP BY id';
  query += ' ORDER BY ' + orderBy + ' ' + direction;
  if (count !== null && offset !== null) {
   query += ' LIMIT ? OFFSET ?';
   params.push(count);
   params.push(offset);
  }
  Log.debug('this.db:', this.db);
  const res = await this.db.query(query, params);
  return res;
 }

 async adminModulesAdd(name, connectionString) {
  await this.db.query('INSERT INTO modules (name, connection_string) VALUES (?, ?)', [name, connectionString]);
 }

 async adminModulesEdit(id, name, connectionString) {
  console.log(id, name, connectionString);
  await this.db.query('UPDATE modules SET name = ?, connection_string = ? WHERE id = ?', [name, connectionString, id]);
 }

 async moduleExistsByID(moduleID) {
  const res = await this.db.query('SELECT id FROM modules WHERE id = ?', [moduleID]);
  return res.length === 1 ? true : false;
 }

 async moduleExistsByName(name) {
  const res = await this.db.query('SELECT id FROM modules WHERE name = ?', [name]);
  return res.length === 1 ? true : false;
 }

 async adminModulesDel(id) {
  await this.db.query('DELETE FROM modules WHERE id = ?', [id]);
 }

 async getModuleInfoByID(moduleID) {
  const res = await this.db.query('SELECT name, connection_string, created FROM modules WHERE id = ?', [moduleID]);
  return res.length === 1 ? res[0] : false;
 }

 async userSetLogin(userID, sessionID) {
  await this.db.query('INSERT INTO users_logins (id_users, session) VALUES (?, ?)', [userID, sessionID]);
  await this.db.query('INSERT INTO users_sessions (id_users, session) VALUES (?, ?)', [userID, sessionID]);
 }

 async userCheckSession(sessionID) {
  const res = await this.db.query('SELECT id FROM users_sessions WHERE session = ?', [sessionID]);
  return res.length === 1 ? true : false;
 }

 async getUserIDBySession(sessionID) {
  const res = await this.db.query('SELECT id_users FROM users_sessions WHERE session = ?', [sessionID]);
  return res.length === 1 ? res[0].id_users : false;
 }

 async userSessionsList(userID, count = 10, offset = 0) {
  const res = await this.db.query('SELECT id, session, last, created FROM users_sessions WHERE id_users = ? LIMIT ? OFFSET ?', [userID, count, offset]);
  return res.length > 0 ? res : false;
 }

 async getDomainIDByName(domain) {
  const res = await this.db.query('SELECT id FROM domains WHERE name = ?', [domain]);
  return res.length === 1 ? res[0].id : false;
 }

 async getDomainNameByID(domainID) {
  const res = await this.db.query('SELECT name FROM domains WHERE id = ?', [domainID]);
  return res.length === 1 ? res[0].name : false;
 }

 async getDomainInfoByID(domainID) {
  const res = await this.db.query('SELECT name, created FROM domains WHERE id = ?', [domainID]);
  return res.length === 1 ? res[0] : false;
 }

 async userSessionsDel(userID, sessionID) {
  await this.db.query('DELETE FROM users_sessions WHERE id_users = ? AND session = ?', [userID, sessionID]);
 }

 async userSessionExists(userID, sessionID) {
  const res = await this.db.query('SELECT session FROM users_sessions WHERE id_users = ? AND session = ?', [userID, sessionID]);
  return res.length === 1 ? true : false;
 }

 async userSessionExpired(sessionID) {
  const res = await this.db.query('SELECT (UNIX_TIMESTAMP(NOW()) - UNIX_TIMESTAMP(last)) > ? AS expired FROM users_sessions WHERE session = ?', [Info.settings.other.session_user, sessionID]);
  return res[0].expired === 1 ? true : false;
 }

 async userUpdateSessionTime(sessionID) {
  return await this.db.query('UPDATE users_sessions SET last = CURRENT_TIMESTAMP WHERE session = ?', [sessionID]);
 }

 async getUserIDByUsernameAndDomainID(username, domainID) {
  const res = await this.db.query('SELECT id FROM users WHERE username = ? AND id_domains = ?', [username, domainID]);
  return res.length === 1 ? res[0].id : false;
 }

 async getUserIDByUsernameAndDomain(username, domain) {
  const res = await this.db.query('SELECT u.id FROM users u JOIN domains d ON u.id_domains = d.id WHERE u.username = ? AND d.name = ?', [username, domain]);
  return res.length === 1 ? res[0].id : false;
 }

 async userGetUserInfo(userID) {
  const res = await this.db.query('SELECT id, username, id_domains, visible_name FROM users WHERE id = ?', [userID]);
  return res.length === 1 ? res[0] : false;
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
