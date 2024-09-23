import { Sequelize, DataTypes, Op } from 'sequelize';
import { Common } from './common.js';
import argon2 from 'argon2';

const sequelize = new Sequelize({
 dialect: 'sqlite',
 storage: 'path_to_your_database.sqlite' // Ujistěte se, že nastavíte správnou cestu k databázi
});

class Data {
 constructor() {
  this.initModels();
 }

 async initModels() {
  // Definice modelů
  this.Admin = sequelize.define(
   'Admin',
   {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(32), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    created: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
   },
   { tableName: 'admins', timestamps: false }
  );

  this.AdminLogin = sequelize.define(
   'AdminLogin',
   {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_admins: { type: DataTypes.INTEGER, references: { model: this.Admin, key: 'id' } },
    session: { type: DataTypes.STRING(128), allowNull: true },
    created: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
   },
   { tableName: 'admins_logins', timestamps: false }
  );

  this.AdminSession = sequelize.define(
   'AdminSession',
   {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_admins: { type: DataTypes.INTEGER, references: { model: this.Admin, key: 'id' } },
    session: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    last: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    created: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
   },
   { tableName: 'admins_sessions', timestamps: false }
  );

  this.Domain = sequelize.define(
   'Domain',
   {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    created: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
   },
   { tableName: 'domains', timestamps: false }
  );

  this.User = sequelize.define(
   'User',
   {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(64), allowNull: false },
    id_domains: { type: DataTypes.INTEGER, references: { model: this.Domain, key: 'id' } },
    visible_name: { type: DataTypes.STRING(255), allowNull: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    created: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
   },
   {
    tableName: 'users',
    timestamps: false,
    indexes: [{ unique: true, fields: ['username', 'id_domains'] }]
   }
  );

  this.UserLogin = sequelize.define(
   'UserLogin',
   {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_users: { type: DataTypes.INTEGER, references: { model: this.User, key: 'id' } },
    session: { type: DataTypes.STRING(128), allowNull: true },
    created: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
   },
   { tableName: 'users_logins', timestamps: false }
  );

  this.UserSession = sequelize.define(
   'UserSession',
   {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_users: { type: DataTypes.INTEGER, references: { model: this.User, key: 'id' } },
    session: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    last: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    created: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
   },
   { tableName: 'users_sessions', timestamps: false }
  );

  this.Message = sequelize.define(
   'Message',
   {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_users: { type: DataTypes.INTEGER, references: { model: this.User, key: 'id' } },
    uid: { type: DataTypes.STRING(255), allowNull: false },
    address_from: { type: DataTypes.STRING(255), allowNull: false },
    address_to: { type: DataTypes.STRING(255), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    seen: { type: DataTypes.DATE, allowNull: true },
    created: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
   },
   { tableName: 'messages', timestamps: false }
  );

  // Definice relací
  this.Admin.hasMany(this.AdminLogin, { foreignKey: 'id_admins' });
  this.Admin.hasMany(this.AdminSession, { foreignKey: 'id_admins' });
  this.AdminLogin.belongsTo(this.Admin, { foreignKey: 'id_admins' });
  this.AdminSession.belongsTo(this.Admin, { foreignKey: 'id_admins' });

  this.Domain.hasMany(this.User, { foreignKey: 'id_domains' });
  this.User.belongsTo(this.Domain, { foreignKey: 'id_domains' });

  this.User.hasMany(this.UserLogin, { foreignKey: 'id_users' });
  this.User.hasMany(this.UserSession, { foreignKey: 'id_users' });
  this.UserLogin.belongsTo(this.User, { foreignKey: 'id_users' });
  this.UserSession.belongsTo(this.User, { foreignKey: 'id_users' });

  this.User.hasMany(this.Message, { foreignKey: 'id_users' });
  this.Message.belongsTo(this.User, { foreignKey: 'id_users' });

  // Synchronizace modelů s databází
  await sequelize.sync();
 }

 async databaseExists() {
  try {
   await sequelize.authenticate();
   return true;
  } catch (error) {
   return false;
  }
 }

 async createDB() {
  try {
   await sequelize.sync();
  } catch (ex) {
   Common.addLog(ex);
   process.exit(1);
  }
 }

 // Další metody přepsané do Sequelize

 async getAdminCredentials(username) {
  const admin = await this.Admin.findOne({
   where: { username },
   attributes: ['id', 'username', 'password']
  });
  return admin || false;
 }

 async adminDelOldSessions() {
  return await this.AdminSession.destroy({
   where: {
    last: {
     [Op.lte]: sequelize.literal(`DATETIME('now', '-${Common.settings.other.session_admin} SECONDS')`)
    }
   }
  });
 }

 async adminSetLogin(adminID, sessionID) {
  await this.AdminLogin.create({ id_admins: adminID, session: sessionID });
  await this.AdminSession.create({ id_admins: adminID, session: sessionID });
 }

 async adminCheckSession(sessionID) {
  const session = await this.AdminSession.findOne({ where: { session: sessionID } });
  return !!session;
 }

 async getAdminIDBySession(sessionID) {
  const session = await this.AdminSession.findOne({ where: { session: sessionID } });
  return session ? session.id_admins : false;
 }

 async adminListSessions(adminID, count = 10, offset = 0) {
  return await this.AdminSession.findAll({
   where: { id_admins: adminID },
   attributes: ['session', 'last', 'created'],
   limit: count,
   offset
  });
 }

 async adminDelSession(adminID, sessionID) {
  await this.AdminSession.destroy({
   where: { id_admins: adminID, session: sessionID }
  });
 }

 async adminSessionExists(adminID, sessionID) {
  const session = await this.AdminSession.findOne({
   where: { id_admins: adminID, session: sessionID }
  });
  return !!session;
 }

 async adminSessionExpired(sessionID) {
  const session = await this.AdminSession.findOne({
   attributes: [[sequelize.literal(`(strftime('%s', 'now') - strftime('%s', last)) > ${Common.settings.other.session_admin}`), 'expired']],
   where: { session: sessionID }
  });
  return session && session.get('expired') ? true : false;
 }

 async adminUpdateSessionTime(sessionID) {
  await this.AdminSession.update({ last: sequelize.fn('CURRENT_TIMESTAMP') }, { where: { session: sessionID } });
 }

 async adminListAdmins(count = 10, offset = 0) {
  return await this.Admin.findAll({
   attributes: ['id', 'username', 'created'],
   limit: count,
   offset
  });
 }

 async adminAddAdmin(username, password) {
  await this.Admin.create({
   username,
   password: await this.getHash(password)
  });
 }

 async adminExistsByID(adminID) {
  const admin = await this.Admin.findOne({ where: { id: adminID } });
  return !!admin;
 }

 async adminExistsByUsername(username) {
  const admin = await this.Admin.findOne({ where: { username } });
  return !!admin;
 }

 async adminEditAdmin(id, username, password) {
  // TODO: Implementace metody
 }

 async adminDelAdmin(id) {
  await this.AdminLogin.destroy({ where: { id_admins: id } });
  await this.AdminSession.destroy({ where: { id_admins: id } });
  await this.Admin.destroy({ where: { id } });
 }

 async adminListDomains(count = 10, offset = 0, orderBy = 'id', direction = 'ASC', filterName = null) {
  let whereClause = {};
  if (filterName) {
   whereClause.name = { [Op.like]: `%${filterName}%` };
  }
  const domains = await this.Domain.findAll({
   attributes: ['id', 'name', 'created', [sequelize.fn('COUNT', sequelize.col('users.id')), 'users_count']],
   include: [{ model: this.User, attributes: [] }],
   where: whereClause,
   group: ['Domain.id'],
   order: [[orderBy === 'users_count' ? sequelize.literal('users_count') : orderBy, direction]],
   limit: count,
   offset,
   subQuery: false
  });
  return domains;
 }

 async adminAddDomain(name) {
  await this.Domain.create({ name });
 }

 async domainExistsByID(domainID) {
  const domain = await this.Domain.findOne({ where: { id: domainID } });
  return !!domain;
 }

 async domainExistsByName(name) {
  const domain = await this.Domain.findOne({ where: { name } });
  return !!domain;
 }

 async adminEditDomain(id, name) {
  await this.Domain.update({ name }, { where: { id } });
 }

 async adminDelDomain(id) {
  await this.Domain.destroy({ where: { id } });
 }

 async adminListUsers(domainID, count = 10, offset = 0) {
  return await this.User.findAll({
   where: { id_domains: domainID },
   attributes: ['id', 'username', 'id_domains', 'visible_name', 'created'],
   limit: count,
   offset
  });
 }

 async adminCountUsers(domainID) {
  return await this.User.count({ where: { id_domains: domainID } });
 }

 async adminAddUser(username, domainID, visible_name, password) {
  await this.User.create({
   username,
   id_domains: domainID,
   visible_name,
   password: await this.getHash(password)
  });
 }

 async userDelOldSessions() {
  return await this.UserSession.destroy({
   where: {
    last: {
     [Op.lte]: sequelize.literal(`DATETIME('now', '-${Common.settings.other.session_user} SECONDS')`)
    }
   }
  });
 }

 async userExistsByID(userID) {
  const user = await this.User.findOne({ where: { id: userID } });
  return !!user;
 }

 async userExistsByUserNameAndDomain(username, domainID) {
  const user = await this.User.findOne({
   where: { username, id_domains: domainID }
  });
  return !!user;
 }

 async adminEditUser(id, username, domainID, visible_name, password) {
  // TODO: Implementace metody
 }

 async adminDelUser(id) {
  await this.UserSession.destroy({ where: { id_users: id } });
  await this.UserLogin.destroy({ where: { id_users: id } });
  await this.User.destroy({ where: { id } });
 }

 async getUserCredentials(username, domainID) {
  const user = await this.User.findOne({
   where: { username, id_domains: domainID },
   attributes: ['id', 'username', 'password']
  });
  return user || false;
 }

 async userSetLogin(userID, sessionID) {
  await this.UserLogin.create({ id_users: userID, session: sessionID });
  await this.UserSession.create({ id_users: userID, session: sessionID });
 }

 async userCheckSession(sessionID) {
  const session = await this.UserSession.findOne({ where: { session: sessionID } });
  return !!session;
 }

 async getUserIDBySession(sessionID) {
  const session = await this.UserSession.findOne({ where: { session: sessionID } });
  return session ? session.id_users : false;
 }

 async userListSessions(userID, count = 10, offset = 0) {
  const sessions = await this.UserSession.findAll({
   where: { id_users: userID },
   attributes: ['id', 'session', 'last', 'created'],
   limit: count,
   offset
  });
  return sessions.length > 0 ? sessions : false;
 }

 async getDomainIDByName(domain) {
  const domainObj = await this.Domain.findOne({ where: { name: domain } });
  return domainObj ? domainObj.id : false;
 }

 async getDomainNameByID(domainID) {
  const domainObj = await this.Domain.findOne({ where: { id: domainID } });
  return domainObj ? domainObj.name : false;
 }

 async getDomainInfoByID(domainID) {
  const domainObj = await this.Domain.findOne({
   where: { id: domainID },
   attributes: ['name', 'created']
  });
  return domainObj || false;
 }

 async userDelSession(userID, sessionID) {
  await this.UserSession.destroy({
   where: { id_users: userID, session: sessionID }
  });
 }

 async userSessionExists(userID, sessionID) {
  const session = await this.UserSession.findOne({
   where: { id_users: userID, session: sessionID }
  });
  return !!session;
 }

 async userSessionExpired(sessionID) {
  const session = await this.UserSession.findOne({
   attributes: [[sequelize.literal(`(strftime('%s', 'now') - strftime('%s', last)) > ${Common.settings.other.session_user}`), 'expired']],
   where: { session: sessionID }
  });
  return session && session.get('expired') ? true : false;
 }

 async userUpdateSessionTime(sessionID) {
  await this.UserSession.update({ last: sequelize.fn('CURRENT_TIMESTAMP') }, { where: { session: sessionID } });
 }

 async getUserIDByUsernameAndDomainID(username, domainID) {
  const user = await this.User.findOne({
   where: { username, id_domains: domainID }
  });
  return user ? user.id : false;
 }

 async getUserIDByUsernameAndDomain(username, domain) {
  const user = await this.User.findOne({
   include: [{ model: this.Domain, where: { name: domain } }],
   where: { username }
  });
  return user ? user.id : false;
 }

 async userGetUserInfo(userID) {
  const user = await this.User.findOne({
   where: { id: userID },
   attributes: ['id', 'username', 'id_domains', 'visible_name']
  });
  return user || false;
 }

 async userSendMessage(userID, uid, address_from, address_to, message) {
  await this.Message.create({
   id_users: userID,
   uid,
   address_from,
   address_to,
   message
  });
 }

 async userGetMessage(userID, uid) {
  const message = await this.Message.findOne({
   where: { uid, id_users: userID },
   attributes: ['id', 'id_users', 'uid', 'address_from', 'address_to', 'message', 'seen', 'created']
  });
  return message || false;
 }

 async userMessageSeen(uid) {
  await this.Message.update({ seen: sequelize.fn('CURRENT_TIMESTAMP') }, { where: { uid } });
 }

 // V třídě Data

 async userListConversations(userID) {
  // Získáme informace o uživateli a jeho e-mailu
  const user = await this.User.findOne({
   where: { id: userID },
   include: [{ model: this.Domain }]
  });

  if (!user) return false;

  const userEmail = `${user.username}@${user.Domain.name}`;

  // Najdeme všechny zprávy související s uživatelem
  const messages = await this.Message.findAll({
   where: {
    [Op.or]: [{ address_from: userEmail }, { address_to: userEmail }]
   },
   attributes: ['address_from', 'address_to', 'message', 'created', 'seen'],
   order: [['created', 'DESC']]
  });

  if (messages.length === 0) return false;

  // Vytvoříme mapu konverzací
  const conversationsMap = new Map();

  for (const msg of messages) {
   const partnerEmail = msg.address_from === userEmail ? msg.address_to : msg.address_from;

   if (!conversationsMap.has(partnerEmail)) {
    conversationsMap.set(partnerEmail, {
     address: partnerEmail,
     last_message_date: msg.created,
     last_message_text: msg.message,
     unread_count: 0,
     visible_name: null // Toto doplníme později
    });
   }

   // Pokud je zpráva nepřečtená a byla poslána partnerem, zvýšíme počet nepřečtených zpráv
   if (!msg.seen && msg.address_from === partnerEmail && msg.address_to === userEmail) {
    conversationsMap.get(partnerEmail).unread_count += 1;
   }
  }

  // Získáme visible_name pro každého partnera
  const partnerEmails = Array.from(conversationsMap.keys());

  const partners = await this.User.findAll({
   include: [{ model: this.Domain }],
   where: {
    [Op.or]: partnerEmails.map(email => {
     const [username, domainName] = email.split('@');
     return {
      [Op.and]: [{ username }, { '$Domain.name$': domainName }]
     };
    })
   }
  });

  // Přidáme visible_name do konverzací
  for (const partner of partners) {
   const email = `${partner.username}@${partner.Domain.name}`;
   if (conversationsMap.has(email)) {
    conversationsMap.get(email).visible_name = partner.visible_name;
   }
  }

  // Převést mapu na pole a seřadit podle poslední zprávy
  const conversations = Array.from(conversationsMap.values()).sort((a, b) => b.last_message_date - a.last_message_date);

  return conversations;
 }

 async userListMessages(userID, address, count = 10, lastID = 0) {
  const myUser = await this.User.findOne({
   where: { id: userID },
   include: [{ model: this.Domain }]
  });
  if (!myUser) return false;
  const email = `${myUser.username}@${myUser.Domain.name}`;

  const messages = await this.Message.findAll({
   where: {
    id_users: userID,
    id: { [Op.gt]: lastID },
    [Op.or]: [
     { address_from: email, address_to: address },
     { address_from: address, address_to: email }
    ]
   },
   attributes: ['id', 'uid', 'address_from', 'address_to', 'message', 'seen', 'created'],
   order: [['id', 'DESC']],
   limit: count
  });
  return messages.length > 0 ? messages : false;
 }

 async getHash(password, memoryCost = 65536, hashLength = 64, timeCost = 20, parallelism = 1) {
  return await argon2.hash(password, {
   type: argon2.argon2id,
   memoryCost,
   hashLength,
   timeCost,
   parallelism
  });
 }

 async verifyHash(hash, password) {
  try {
   return await argon2.verify(hash, password);
  } catch (err) {
   return false;
  }
 }
}

export default Data;
