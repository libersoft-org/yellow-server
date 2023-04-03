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
}

module.exports = Validation;