class Validation {
  static isValidAdminUserName(adminName) {
    if (adminName !== undefined || adminName !== '' || !adminName) {
      return true;
    }

    return false;
  }

  static isValidAdminPass(adminPass) {
    if (!adminPass || adminPass !== undefined || adminPass !== '' || adminPass.length < 5) {
      return true;
    }

    return false;
  }

  static isValidUserName(userName) {
    if (userName !== undefined || userName !== '' || !userName) {
      return true;
    }

    return false;
  }

  static isValidUserPass(userPass) {
    if (!userPass || userPass !== undefined || userPass !== '' || userPass.length < 5) {
      return true;
    }

    return false;
  }
}

module.exports = Validation;
