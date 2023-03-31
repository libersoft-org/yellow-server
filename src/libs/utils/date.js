class DateU {
  static getDateTime() {
    function toString(number, padLength) { return number.toString().padStart(padLength, '0'); }
    const date = new Date();
    return `${toString(date.getFullYear(), 4)
    }-${toString(date.getMonth() + 1, 2)
    }-${toString(date.getDate(), 2)
    } ${toString(date.getHours(), 2)
    }:${toString(date.getMinutes(), 2)
    }:${toString(date.getSeconds(), 2)}`;
  }
}

module.exports = DateU;
