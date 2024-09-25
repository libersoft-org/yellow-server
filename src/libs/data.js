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
   this.db.query('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, id_users INTEGER, uid VARCHAR(255) NOT NULL, address_from VARCHAR(255) NOT NULL, address_to VARCHAR(255) NOT NULL, message TEXT NOT NULL, seen TIMESTAMP DEFAULT NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_users) REFERENCES users(id))');
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
  return this.db.query('SELECT session, last, created FROM admins_sessions WHERE id_admins = ? LIMIT ? OFFSET ?', [adminID, count, offset]);
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

 adminListAdmins(count = 10, offset = 0, orderBy = 'id', direction = 'ASC', filterName = null) {
  let query = 'SELECT id, username, created FROM admins';
  const params = [];
  if (filterName !== null) {
   query += ' WHERE username LIKE ?';
   params.push(`%${filterName}%`);
  }
  query += ' ORDER BY ' + orderBy + ' ' + direction;
  query += ' LIMIT ? OFFSET ?';
  params.push(count);
  params.push(offset);
  return this.db.query(query, params);
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

 adminListDomains(count = 10, offset = 0, orderBy = 'id', direction = 'ASC', filterName = null) {
  let query = 'SELECT d.id, d.name, COUNT(u.id) AS users_count, d.created FROM domains d LEFT JOIN users u ON u.id_domains = d.id';
  const params = [];
  if (filterName !== null) {
   query += ' WHERE d.name LIKE ?';
   params.push(`%${filterName}%`);
  }
  query += ' GROUP BY d.id';
  query += ' ORDER BY ' + (orderBy === 'users_count' ? orderBy : 'd.' + orderBy) + ' ' + direction;
  query += ' LIMIT ? OFFSET ?';
  params.push(count);
  params.push(offset);
  console.log(query, params);
  return this.db.query(query, params);
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
  this.db.query('UPDATE domains SET name = ? WHERE id = ?', [name, id]);
 }

 adminDelDomain(id) {
  this.db.query('DELETE FROM domains WHERE id = ?', [id]);
 }

 adminListUsers(domainID, count = 10, offset = 0) {
  return this.db.query('SELECT id, username, id_domains, visible_name, created FROM users WHERE id_domains = ? LIMIT ? OFFSET ?', [domainID, count, offset]);
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
  const res = this.db.query('SELECT id, session, last, created FROM users_sessions WHERE id_users = ? LIMIT ? OFFSET ?', [userID, count, offset]);
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

 getDomainInfoByID(domainID) {
  const res = this.db.query('SELECT name, created FROM domains WHERE id = ?', [domainID]);
  return res.length === 1 ? res[0] : false;
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

 getUserIDByUsernameAndDomain(username, domain) {
  const res = this.db.query('SELECT u.id FROM users u JOIN domains d ON u.id_domains = d.id WHERE u.username = ? AND d.name = ?', [username, domain]);
  return res.length === 1 ? res[0].id : false;
 }

 userGetUserInfo(userID) {
  const res = this.db.query('SELECT id, username, id_domains, visible_name FROM users WHERE id = ?', [userID]);
  return res.length === 1 ? res[0] : false;
 }

 userSendMessage(userID, uid, address_from, address_to, message) {
  return this.db.query('INSERT INTO messages (id_users, uid, address_from, address_to, message) VALUES (?, ?, ?, ?, ?)', [userID, uid, address_from, address_to, message]);
 }

 userGetMessage(userID, uid) {
  const res = this.db.query('SELECT id, id_users, uid, address_from, address_to, message, seen, created FROM messages WHERE uid = ? and id_users = ?', [uid, userID]);
  return res.length === 1 ? res[0] : false;
 }

 userMessageSeen(uid) {
  this.db.query('UPDATE messages SET seen = CURRENT_TIMESTAMP WHERE uid = ?', [uid]);
 }

 userListConversations(userID) {
  const res = this.db.query(
   `
   WITH user_info AS (
    SELECT 
     u.id AS user_id,
     u.username || '@' || d.name AS address
    FROM users u
    JOIN domains d ON u.id_domains = d.id
    WHERE u.id = :userID
   ),
   user_messages AS (
    SELECT
     m.*,
     CASE
      WHEN m.address_from = (SELECT address FROM user_info) THEN m.address_to
      ELSE m.address_from
     END AS other_address
    FROM messages m
    WHERE m.id_users = :userID
    AND (m.address_from = (SELECT address FROM user_info)
        OR m.address_to = (SELECT address FROM user_info))
   ),
   last_messages AS (
    SELECT
     um.other_address,
     um.message AS last_message_text,
     um.created AS last_message_date,
     ROW_NUMBER() OVER (PARTITION BY um.other_address ORDER BY um.created DESC) AS rn
    FROM user_messages um
   ),
   unread_counts AS (
    SELECT
     m.address_from AS other_address,
     COUNT(*) AS unread_count
    FROM messages m
    WHERE
     m.address_to = (SELECT address FROM user_info)
     AND m.seen IS NULL
     AND m.id_users = :userID
    GROUP BY m.address_from
   ),
   user_addresses AS (
    SELECT
     u.username || '@' || d.name AS address,
     u.visible_name
    FROM users u
    JOIN domains d ON u.id_domains = d.id
   )
   SELECT
    lm.other_address AS address,
    ua.visible_name,
    lm.last_message_text,
    lm.last_message_date,
    COALESCE(uc.unread_count, 0) AS unread_count
   FROM last_messages lm
   LEFT JOIN user_addresses ua ON ua.address = lm.other_address
   LEFT JOIN unread_counts uc ON uc.other_address = lm.other_address
   WHERE lm.rn = 1
   ORDER BY lm.last_message_date DESC;
  `,
   [userID]
  );
  console.log(res);
  return res.length > 0 ? res : false;
 }

 userListMessages(userID, address, count = 10, lastID = 0) {
  const res = this.db.query(
   `
   WITH my_email AS (
    SELECT u.username || '@' || d.name AS email
    FROM users u
    JOIN domains d ON u.id_domains = d.id
    WHERE u.id = ?
   )
   SELECT id, uid, address_from, address_to, message, seen, created
   FROM messages
   WHERE id_users = ?
   AND (
    (address_from = (SELECT email FROM my_email) AND address_to = ?)
    OR
    (address_from = ? AND address_to = (SELECT email FROM my_email))
   )
   AND id > ?
   ORDER BY id DESC
   LIMIT ?
  `,
   [userID, userID, address, address, lastID, count]
  );
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
