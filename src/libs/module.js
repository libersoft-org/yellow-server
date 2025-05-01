import { newLogger } from 'yellow-server-common';
let Log = newLogger('module');

class Module {
 constructor(app, data, id, name, connection_string) {
  Log.debug('Creating module: ', name);
  this.ws = null;
  this.log = Log.child(name);
  this.app = app;
  this.data = data;
  this.id = id;
  this.name = name;
  this.connection_string = connection_string;
  this.requests = {};
 }

 async connect() {
  this.log.info('Connecting to the module: ', this.connection_string);
  try {
   this.ws = new WebSocket(this.connection_string);
  } catch (e) {
   this.log.error('Error creating WebSocket:', e);
   return;
  }

  this.ws.addEventListener('open', async () => {
   this.log.info('Connected to module: ' + this.connection_string);
   this.connected = true;
   await this.notifyModuleAvailable();
  });

  this.ws.addEventListener('message', async event => {
   let msg = null;
   try {
    msg = JSON.parse(event.data);
   } catch (e) {
    this.log.error('Error parsing JSON:', event.data);
    return;
   }
   this.log.trace('Message from module', this.name, msg);
   if (msg.type === 'response') {
    const wsGuid = msg.wsGuid;
    const requestID = msg.requestID;
    if (!requestID) {
     this.log.warning('No request ID in the response:', msg);
     return;
    }
    if (!wsGuid) {
     this.log.warning('No wsGuid in the response:', msg);
     return;
    }
    const cb = this.requests[wsGuid]?.[requestID]?.resolve;
    if (!cb) {
     this.log.warning('No callback for the request:', msg);
    } else {
     cb(msg);
    }
    delete this.requests[wsGuid]?.[requestID];
   } else if (msg.type === 'notify') {
    this.log.trace('Notify from module', this.name, msg);
    let client_ws = this.app.webServer.clients.get(msg.wsGuid)?.ws;
    if (!client_ws) {
     this.log.trace('No client ws for wsGuid, (disconnected?):', msg);
     return;
    }
    await client_ws.send(JSON.stringify(msg));
   } else if (msg.type === 'command') {
    this.log.trace('Command from module', this.name, msg);
    await this.send({}, { type: 'response', requestID: msg.requestID, result: await this.processCommandFromModule(msg) });
   } else {
    this.log.error('Unknown message type from module', this.name, msg);
   }
  });
  this.ws.addEventListener('error', event => {
   this.log.error('Error in module connection to', this.name);
   this.log.debug(event);
  });
  this.ws.addEventListener('close', async () => {
   if (!this.ws) return;
   await this.onClose();
   setTimeout(() => {
    if (!this.ws) return;
    this.log.info('Reconnecting to module: ' + this.connection_string);
    this.connect();
   }, 1000);
  });
 }

 async disconnect() {
  this.log.debug('Disconnecting from module: ' + this.connection_string);
  if (this.ws) {
   this.ws.close();
   this.ws = null;
  }
  await this.onClose();
 }

 async onClose() {
  this.log.info('Closing connection to module: ' + this.connection_string);
  if (this.connected) {
   this.connected = false;
   await this.notifyModuleAvailable();
  }
 }

 async notifyModuleAvailable() {
  let ma = {};
  ma[this.name] = this.connected;
  this.app.webServer.clients.forEach(async (client, wsGuid) => {
   this.log.debug('Notifying client of modules available:', wsGuid, client, ma);
   await client.ws.send(JSON.stringify({ type: 'notify', event: 'modules_available', data: { modules_available: ma } }));
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
   getUserAddressByID: this.data.getUserAddressByID.bind(this.data),
  };
  const cmd_fn = cmds[cmd];
  if (!cmd_fn) {
   const err = { error: 903, message: 'Unknown core API command' };
   this.log.error(err);
   return err;
  }
  return await cmd_fn(...msg.params);
 }

 async sendRequest(corr, msg, wsGuid, requestID) {
  corr = { ...corr, module: this.name };
  if (!this.requests[wsGuid]) this.requests[wsGuid] = {};
  if (this.requests[wsGuid]?.[requestID]) {
   this.log.error(corr, 'Request already exists:', wsGuid, requestID);
   return;
  }
  let promise = new Promise((resolve, reject) => {
   this.requests[wsGuid][requestID] = { resolve, reject };
   this.log.trace(corr, 'Request to module:', this.name, requestID);
   this.send(corr, { type: 'request', ...msg });
  });
  return await promise;
 }

 async send(corr, msg) {
  if (!this.ws) {
   this.log.debug(corr, 'No websocket connection to module:', this.name);
   return;
  }
  this.log.trace(corr, 'Sending message to module:', this.name, msg, this.ws);
  return await this.ws.send(JSON.stringify({ ...msg, corr: { ...corr, app: this.name } }));
 }

 /*async notify(notification) {
  await this.send({}, { type: 'notify', data: notification });
 }*/

 async handleClientDisconnect(wsGuid) {
  for (let requestID in this.requests[wsGuid]) {
   this.requests[wsGuid][requestID].reject({ error: 1000, message: 'Client disconnected' });
  }
  delete this.requests[wsGuid];
  this.send({}, { type: 'server_command', cmd: 'client_disconnect', wsGuid });
 }
}

export default Module;
