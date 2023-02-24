const Database = require('./database.js');
const Common = require('./common.js').Common;
const Argon2 = require('argon2');

class Data {
 constructor() {
  this.db = new Database();
 }
 regex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;

 async createDB() {
  try {
   await this.db.write('CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, user VARCHAR(32) NOT NULL UNIQUE, pass VARCHAR(255) NOT NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
   await this.db.write('CREATE TABLE IF NOT EXISTS admins_login (id INTEGER PRIMARY KEY AUTOINCREMENT, id_admin INTEGER, token VARCHAR(64) NOT NULL UNIQUE, updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_admin) REFERENCES admins(id))');
   await this.db.write('CREATE TABLE IF NOT EXISTS domains (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(255) NOT NULL UNIQUE, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
   await this.db.write('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, id_domain INTEGER REFERENCES domains(id), name VARCHAR(64) NOT NULL UNIQUE, visible_name VARCHAR(255) NULL, pass VARCHAR(255) NOT NULL, photo VARCHAR(255) NULL UNIQUE, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (name) REFERENCES aliases(alias) UNIQUE (name, id_domain)');
   await this.db.write('CREATE TABLE IF NOT EXISTS users_login (id INTEGER PRIMARY KEY AUTOINCREMENT, id_user INTEGER, token VARCHAR(64) NOT NULL UNIQUE, updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_user) REFERENCES users(id))');
   await this.db.write('CREATE TABLE IF NOT EXISTS aliases (id INTEGER PRIMARY KEY AUTOINCREMENT, alias VARCHAR(64) NOT NULL UNIQUE, id_domain INTEGER REFERENCES domains(id), mail VARCHAR(255) NOT NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (alias) REFERENCES users(name) UNIQUE (alias, id_domain)');
   await this.db.write('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, id_user INTEGER, email VARCHAR(255) NOT NULL, message TEXT NOT NULL, encryption VARCHAR(5) NOT NULL DEFAULT "", public_key VARCHAR(64) NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_user) REFERENCES users(id))');
   await this.db.write('CREATE TABLE IF NOT EXISTS contacts (id INTEGER PRIMARY KEY AUTOINCREMENT, id_user INTEGER, name VARCHAR(64) NOT NULL, visible_name VARCHAR(255), email VARCHAR(255) NOT NULL UNIQUE, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_user) REFERENCES users(id))');
  } catch (ex) {
   Common.addLog({ex});
   process.exit(1);
  }
 }

 res = {
  'error': true,
  'message': `Missing or invalid input data`
 };

 isValidInput(input) {
  for(let i = 0; i < input.length; i++) {
    if(input[i] === undefined || input[i] === '' || !input[i]) return false;
  }
  return true;
 }
 isValidString(str) {
  return !/^\.|\.$|\s/.test(str);
}
 async adminGetLogin(user, pass) {
  var res = await this.db.read('SELECT id, user, pass FROM admins WHERE user = $1', [user.toLowerCase()]);
  if (res.length === 1) {
   if (await this.verifyHash(res[0].pass, pass)) {
    var token = this.getToken(64);
    await this.db.write('INSERT INTO admins_login (id_admin, token) VALUES ($1, $2)', [res[0].id, token]);
    return { logged: true, token: token, id: res[0].id };
   } else return { logged: false, message: 'Wrong username or password' }
  } else return { logged: false, message: 'Wrong username or password' }
 }

 async adminGetTokenExists(token) {
  var res = await this.db.read('SELECT id FROM admins_login WHERE token = $1', [token]);
  return res.length === 1 ? true : false;
 }

 async adminIsTokenValid(token) {
  var res = await this.db.read('SELECT token, updated FROM admins_login WHERE token = $1', [token]);
  return res.length > 0 ? true : false;
 }

 async adminDeleteToken(token) {
  return await this.db.write('DELETE FROM admins_login WHERE token = $1', [token]);
 }

 async adminDeleteOldTokens() {
  return await this.db.write('DELETE FROM admins_login WHERE DATETIME(updated, "$1 seconds") < DATETIME("now")', [Common.settings.webadmin_ttl]);
 }

 async adminUpdateTokenTime(token) {
  return await this.db.write('UPDATE admins_login SET updated = $1 WHERE token = $2', [Common.getDateTime(new Date()), token]);
 }

 async adminGetDomains() {
  return await this.db.read('SELECT id, name, created FROM domains');
 }

 async adminAddDomain(name) {
  let callIsValidInput = this.isValidInput([name]);
  if(!callIsValidInput) return this.res;
  if(!this.isValidString(name)) return this.res;
  if(!this.regex.test(name)) return this.res;
  return await this.db.write('INSERT INTO domains (name) VALUES ($1)', [name]);
 }

 async adminSetDomain(id, name) {
  if(!id && !name) return this.res;
  return await this.db.write('UPDATE domains SET name = $1 WHERE id = $2', [name, id]);
 }

 async adminDelDomains(id) {
  console.log('starting...');
  let hasUsers = await this.db.read('SELECT id FROM users WHERE id_domain = $1', [id]);
  console.log('seen users...');
  if(hasUsers.length > 0) return {
    'error': true,
    'message': 'Cannot remove domain with users'
  };
  console.log('final logger...');
  return await this.db.write('DELETE FROM domains WHERE id = $1', [id]);
 }

 async adminGetUsers(id) {
  if(id === undefined) return [];
  return await this.db.read(
    `SELECT users.id, users.name, users.visible_name, users.photo, users.created, COUNT(messages.id) AS message_count
    FROM users LEFT JOIN messages ON messages.id_user = users.id WHERE users.id_domain = $1 GROUP BY users.id;`, [id]);
 }

 async adminAddUser(domainID, name, visibleName, pass) {
  let callIsValidInput = this.isValidInput([domainID, name, pass]);
  if(!callIsValidInput) return this.res;
  if(!this.isValidString(name) && !this.isValidString(visibleName)) return this.res;
  if(!this.regex.test(name)) return this.res;
  let activeDomain = await this.db.read('SELECT id FROM domains WHERE id = $1', [domainID]);
  if(!activeDomain || activeDomain.length === 0) return {
    error: true,
    message: "Invalid domain id"
  }
  let existsUser = await this.db.read('SELECT id from aliases WHERE alias = $1 AND id_domain = $2', [name, domainID]);
  if(existsUser.length > 0) return {
    error: true,
    message: "cannot create user with this name, found alias in this domain"
  }
  return await this.db.write("INSERT INTO users (id_domain, name, visible_name, pass) VALUES ($1, $2, $3, $4)", [domainID, name, visibleName, pass]);
 }

 async adminSetUser(id, domainID, name, visibleName, photo, pass) {
  let callIsValidInput = this.isValidInput([id, domainID, name, pass]);
  if(!callIsValidInput) return this.res;
  if(!this.regex.test(name)) return this.res;
  return await this.db.write('UPDATE users SET id_domain = $1, name = $2, visible_name = $3, photo = $4, pass = $5 WHERE id = $6', [domainID, name, visibleName, photo, pass, id]);
 }

 async adminDelUser(id) {
  return await this.db.write('DELETE FROM users WHERE id= $1', [id]);
 }

 async adminGetAliases(domainID) {
  if(domainID === undefined) return [];
  return await this.db.read('SELECT id, alias, mail, created FROM aliases WHERE id_domain = $1', [domainID]);
 }

 async adminAddAlias(domainID, alias, mail) {
  let callIsValidInput = this.isValidInput([domainID, alias, mail]);
  if(!callIsValidInput) return this.res;
  if(!this.isValidString(alias) && !this.isValidString(mail)) return this.res;
  if(!this.regex.test(alias)) return this.res;
  let activeDomain = await this.db.read('SELECT id FROM domains WHERE id = $1', [domainID]);
  if(!activeDomain || activeDomain.length === 0) return {
    error: true,
    message: "Invalid domain id"
  }
  let existsUser = await this.db.read('SELECT id from users WHERE name = $1 AND id_domain = $2', [alias, domainID]);
  if(existsUser.length > 0) return {
    error: true,
    message: "cannot create alias with this name, found user in this domain"
  }
  return await this.db.write("INSERT INTO aliases (id_domain, alias, mail) VALUES ($1, $2, $3)", [domainID, alias, mail]);
 }

 async adminSetAlias(id, alias, mail) {
  if(!id && !alias && !mail) return this.res;
  if(!this.regex.test(alias)) return this.res;
  return await this.db.write('UPDATE aliases SET alias = $1, mail = $2 WHERE id = $3', [alias, mail, id]);
 }

 async adminDelAlias(id) {
  return await this.db.write('DELETE FROM aliases WHERE id= $1', [id]);
 }

 async adminGetAdmins() {
  return await this.db.read('SELECT id, user, created FROM admins');
 }

 async adminAddAdmin(user, pass) {
  let callIsValidInput = this.isValidInput([user, pass]);
  if(!callIsValidInput) return this.res;
  return await this.db.write('INSERT INTO admins (user, pass) VALUES ($1, $2)', [user, await this.getHash(pass)]);
 }

 async adminSetAdmin(id, user, pass) {
  return await this.db.write('UPDATE admins SET user = $1, pass = $2 WHERE id = $3', [user, pass != '' ? ', pass = "' + pass + '"' : '', id]);
 }

 async adminDelAdmin(id) {
  return await this.db.write('DELETE FROM admins WHERE id = $1', [id]);
 }

 getToken(len) {
  let res = '';
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < len; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
  return res;
 }

 async getHash(password, memoryCost = 2 ** 16, hashLength = 64, timeCost = 20, parallelism = 1) {
  // default: 64 MB RAM, 64 characters length, 20 difficulty to calculate, 1 thread needed
  return await Argon2.hash(password, { memoryCost: memoryCost, hashLength: hashLength, timeCost: timeCost, parallelism: parallelism });
 }

 async verifyHash(hash, password) {
  return await Argon2.verify(hash, password);
 }
}

module.exports = Data;