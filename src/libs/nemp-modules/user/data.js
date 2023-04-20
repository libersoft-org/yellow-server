const crypto = require('crypto');
const NempModuleData = require('../../main-module/nemp-module-data');
const Validation = require('../../utils/validation');
const Encryption = require('../../encryption');

class UsersData extends NempModuleData {
  async usersCreateAccount(accountData) {
    const {
      user, pass, firstname, lastname, phone, birth, gender,
    } = accountData;

    if (!Validation.isValidUserName(user) || !Validation.isValidUserPass(pass)) {
      throw new Error('Invalid username or password ');
    }

    const id = crypto.randomBytes(16).toString('hex');

    const result = await this.db.write(
      `INSERT INTO users (id, user, pass, firstname, lastname, phone, birth, gender) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        user,
        await Encryption.getHash(pass),
        firstname,
        lastname,
        phone,
        birth,
        gender,
      ],
    );

    if (result && result.error) {
      throw new Error(result.error.message);
    }

    return result;
  }

  async userLogin(user, pass) {
    const res = await this.db.read('SELECT id, user, pass FROM users WHERE user = $1', [user.toLowerCase()]);

    if (await Encryption.verifyHash(res[0].pass, pass)) {
      const token = Encryption.getToken(64);
      await this.db.write('INSERT INTO users_login (id_user, token) VALUES ($1, $2)', [res[0].id, token]);
      return { token, id: res[0].id };
    }
    throw new Error('Wrong username or password');
  }

  async userLogout(token) {
    const isTokenExist = await this.db.read('SELECT id FROM users_login WHERE token = $1', [token]);

    if (!isTokenExist) {
      throw new Error('Token not exist');
    }
    await this.db.write('DELETE FROM users_login WHERE token = $1', [token]);
  }

  async userInfoFromToken(token) {
    const userId = await this.db.read('SELECT id_user FROM users_login WHERE token = $1', [token]);
    const data = await this.db.read('SELECT id, firstname, lastname, gender FROM users WHERE id = $1', [userId[0].id_user]);
    return data;
  }

  async userInfoFromId(userId) {
    const data = await this.db.read('SELECT id, firstname, lastname, gender FROM users WHERE id = $1', [userId]);
    return data;
  }

  async tokenToUserId(token) {
    const userId = await this.db.read('SELECT id_user FROM users_login WHERE token = $1', [token]);
    if (userId[0]) {
      return userId[0].id_user;
    }

    return null;
  }

  async userIdExist(userId) {
    const userExist = await this.db.read('SELECT COUNT(id) FROM users WHERE id = $1', [userId]);
    if (userExist[0]['COUNT(id)'] > 0) {
      return true;
    }

    return false;
  }
}

module.exports = UsersData;
