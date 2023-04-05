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

    const result = await this.db.write(
      `INSERT INTO users (user, pass, firstname, lastname, phone, birth, gender) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
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
      await this.db.write('INSERT INTO admins_login (id_admin, token) VALUES ($1, $2)', [res[0].id, token]);
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
}

module.exports = UsersData;
