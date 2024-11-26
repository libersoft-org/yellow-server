/*

 We try to maintain flexibility for different types of modules with unexpected kinds of workloads.

 Requests to modules construct promises.

 The promises are not automatically rejected when the module is disconnected.
 A module might still be able to answer after a disconnect, as in the case of a long running operation.
 todo, A module that does not persist requests should send a "clear" command to server on connect, which would clear the request queue on server.

 In the same vein, the server does not impose timeouts on requests to modules.
 Clients should implement timeouts where appropriate.

 */


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

  try {
   this.ws = new WebSocket(this.connection_string);
  } catch (e) {
   Log.error('Error creating WebSocket:', e);
   return;
  }

  this.ws.addEventListener('open', async () => {
   Log.info('Connected to module: ' + this.connection_string);
   this.connected = true;
   await this.notifyModuleAvailable();
  });

  this.ws.addEventListener('message', async event => {

   let msg = null;
   try {
    msg = JSON.parse(event.data);
   } catch (e) {
    Log.error('Error parsing JSON:', event.data);
    return;
   }

   //Log.info('Message from module', this.name, msg);

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

    const cb = this.requests[wsGuid]?.[requestID]?.resolve;
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
   Log.error('Error in module connection to', this.name);
   Log.error(event)
  });

  this.ws.addEventListener('close', async () => {
   Log.info('Connection to module closed: ' + this.connection_string);
   if (this.connected) {
    this.connected = false;
    await this.notifyModuleAvailable();
   }
   setTimeout(() => {
    Log.info('Reconnecting to module: ' + this.connection_string);
    this.connect();
   }, 1000);
  });
 }

 async notifyModuleAvailable() {
  let ma = {};
  ma[this.name] = this.connected;
  this.app.webServer.clients.forEach(async (client, wsGuid) => {
   Log.debug('Notifying client of modules available:', wsGuid, client);
   await client.ws.send(JSON.stringify({type: 'notify', event: 'modules_available', data: {modules_available: ma}}));
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
  if (!this.requests[wsGuid]) {
   this.requests[wsGuid] = {};
  }

  if (this.requests[wsGuid]?.[requestID]) {
   Log.error('Request already exists:', wsGuid, requestID);
   return;
  }

  let promise = new Promise((resolve, reject) => {
   this.requests[wsGuid][requestID] = { resolve, reject };
   //Log.debug('Request to module:', this.name, requestID);
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

 async handleClientDisconnect(wsGuid) {
  for (let requestID in this.requests[wsGuid]) {
   this.requests[wsGuid][requestID].reject({ error: 1000, message: 'Client disconnected' });
  }
  delete this.requests[wsGuid];
 }

}

export default Module;
