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
    const response = {
      status: 'success',
      command,
      data: null,
    };
    return JSON.stringify(response);
  }

  static sendData(command, data) {
    const response = {
      status: 'success',
      command,
      data,
    };
    return JSON.stringify(response);
  }

  static sendError(command, type, message = null) {
    const response = {
      status: 'error',
      command,
      data: null,
      error: {
        type,
        message,
      },
    };
    return JSON.stringify(response);
  }
}

module.exports = Response;
