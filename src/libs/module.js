import { Log } from 'yellow-server-common';

class Module {
 constructor(app, data, name, connection_string) {
  this.app = app;
  this.data = data;
  this.name = name;
  this.connection_string = connection_string;
  this.requests = {};
 }

 async connect() {
  Log.info('Connecting to the module: ', this.connection_string);

  //this.ws = new ReconnectingWebSocket(this.connection_string, [], {debug:true});
  this.ws = new WebSocket(this.connection_string);

  this.ws.addEventListener('open', async () => {
   Log.info('Connected to module: ' + this.connection_string);
   this.app.webServer.clients.forEach(async (wsGuid, client) => {
    this.connected = true;
    await client.ws.send(JSON.stringify({ type: 'notify', event: 'modules_available', data: { modules_available: {this.name: true }}}));
   })
  });

  this.ws.addEventListener('message', async event => {

   let msg = null;
   try {
    msg = JSON.parse(event.data);
   } catch (e) {
    Log.error('Error parsing JSON:', event.data);
    return;
   }

   Log.info('Message from module', this.name, msg);

   if (msg.type === 'response') {
    const wsGuid = msg.wsGuid;
    const requestID = msg.requestID;

    if (!requestID) {
     Log.warning('No request ID in the response:', msg);
     return;
    }
    if (!wsGuid) {
     Log.warning('No wsGuid in the response:', msg);
     return;
    }

    const cb = this.requests[wsGuid]?.[requestID];
    if (!cb) {
     Log.warning('No callback for the request:', msg);
     return;
    }

    cb(msg);
    delete this.requests[wsGuid]?.[requestID];
   } else if (msg.type === 'notify') {
    Log.info('Notify from module', this.name, msg);
    let client_ws = this.app.webServer.clients.get(msg.wsGuid)?.ws;
    if (!client_ws) {
     //Log.debug('No client ws for wsGuid, (disconnected?):', msg);
     return;
    }
    await client_ws.send(JSON.stringify(msg));
   } else if (msg.type === 'command') {
    ///Log.info('Command from module', this.name, msg);
    await this.send({ type: 'response', requestID: msg.requestID, result: await this.processCommandFromModule(msg) });
   } else {
    Log.warning('Unknown message type from module', this.name, msg);
   }
  });

  this.ws.addEventListener('error', event => {
   Log.error('Error in module connection to ', this.name, event);
  });

  this.ws.addEventListener('close', () => {
   Log.info('Disconnected from module: ' + this.connection_string);
   this.connected = false;
   setTimeout(() => {
    Log.info('Reconnecting to module: ' + this.connection_string);
    this.connect();
   }, 1000);
  });
 }

 async processCommandFromModule(msg) {
  const cmd = msg.command;
  const cmds = {
   getDomainNameByID: this.data.getDomainNameByID.bind(this.data),
   getDomainIDByName: this.data.getDomainIDByName.bind(this.data),
   getUserIDByUsernameAndDomainID: this.data.getUserIDByUsernameAndDomainID.bind(this.data),
   getUserIDByUsernameAndDomainName: this.data.getUserIDByUsernameAndDomainName.bind(this.data),
   userGetUserInfo: this.data.userGetUserInfo.bind(this.data),
  };
  const cmd_fn = cmds[cmd];
  if (!cmd_fn) {
   const err = { error: 903, message: 'Unknown core API command' };
   Log.error(err);
   return err;
  }
  return await cmd_fn(...msg.params);
 }

 async sendRequest(msg, wsGuid, requestID) {
  if (this.requests[wsGuid]?.[requestID]) {
   console.log('Request already exists:', wsGuid, requestID);
   return;
  }

  const ws_requests = this.requests[wsGuid];
  if (!ws_requests) {
   this.requests[wsGuid] = {};
  }

  let promise = new Promise((resolve, reject) => {
   this.requests[wsGuid][requestID] = res => {
    resolve(res);
   };
   this.send({ type: 'request', ...msg });
  });

  return await promise;
 }

 async send(msg) {
  return await this.ws.send(JSON.stringify(msg));
 }

 async notify(notification) {
  await this.send({ type: 'notify', data: notification });
 }

}

export default Module;
