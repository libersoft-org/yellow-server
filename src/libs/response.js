/**
 * Server response
 * base props of every response
  {
   status -> 'success' or 'error'
   command -> the command to which the response is returned
   data -> object with data
   *error -> set only if status === 'error'
  }
 */

class Response {
  static sendSuccess(command) {
    return {
      status: 'success',
      command,
      data: null,
    };
  }

  static sendData(command, data) {
    return {
      status: 'success',
      command,
      data,
    };
  }

  static sendError(command, type, message = null) {
    return {
      status: 'error',
      command,
      data: null,
      error: {
        type,
        message,
      },
    };
  }
}

module.exports = Response;
