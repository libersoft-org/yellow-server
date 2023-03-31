const Argon2 = require('argon2');

class Encryption {
  static getToken(len) {
    let res = '';
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < len; i += 1) res += chars.charAt(Math.floor(Math.random() * chars.length));
    return res;
  }

  static async getHash(
    password,
    memoryCost = 2 ** 16,
    hashLength = 64,
    timeCost = 20,
    parallelism = 1,
  ) {
    // default: 64 MB RAM, 64 characters length, 20 difficulty to calculate, 1 thread needed
    const hash = await Argon2.hash(password, {
      memoryCost, hashLength, timeCost, parallelism,
    });

    return hash;
  }

  static async verifyHash(hash, password) {
    const result = await Argon2.verify(hash, password);
    return result;
  }
}

module.exports = Encryption;
