const Database = require('./database_sqlite.js');
const Common = require('./common.js').Common;
const Argon2 = require('argon2');
const punycode = require('punycode/');

class Data {
 constructor() {
  this.db = new Database();
 }
 domain_regex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
 name_regex = /^$|\s+/;
 alias_regex = /^[a-zA-Z*-]+(-[a-zA-Z*-]+)*$/;
 async createDB() {
  try {
   // THIS STAYS HERE AS IT IS A PART OF THE CORE:
   await this.db.write('CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, user VARCHAR(32) NOT NULL UNIQUE, pass VARCHAR(255) NOT NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
   await this.db.write('CREATE TABLE IF NOT EXISTS admins_login (id INTEGER PRIMARY KEY AUTOINCREMENT, id_admin INTEGER, token VARCHAR(64) NOT NULL UNIQUE, updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_admin) REFERENCES admins(id))');
   await this.db.write('CREATE TABLE IF NOT EXISTS aliases (id INTEGER PRIMARY KEY AUTOINCREMENT, alias VARCHAR(64) NOT NULL UNIQUE, id_domain INTEGER REFERENCES domains(id), mail VARCHAR(255) NOT NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (alias) REFERENCES users(name), UNIQUE(alias, id_domain))');
   // MOVE THESE TABLES TO MESSAGES MODULE:
   await this.db.write('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, id_user INTEGER, email VARCHAR(255) NOT NULL, message TEXT NOT NULL, encryption VARCHAR(5) NOT NULL DEFAULT "", public_key VARCHAR(64) NULL, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_user) REFERENCES users(id))');
   // MOVE THESE TABLES TO CONTACTS MODULE:
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
validateIDN(input) {
  input = input.toString();
  const normalizedValue = input.normalize('NFC');
 const punycodeValue = punycode.toASCII(normalizedValue);
 if (input !== punycodeValue) {
  return false;
 } else {
  return true;
 }
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
  return await this.db.write("DELETE FROM admins_login WHERE DATETIME(updated, ? || ' seconds') < DATETIME('now')", [Common.settings.admin_ttl]);
 }

 async adminUpdateTokenTime(token) {
  return await this.db.write('UPDATE admins_login SET updated = $1 WHERE token = $2', [Common.getDateTime(new Date()), token]);
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
