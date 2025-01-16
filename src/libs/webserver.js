import path from 'path';
import API from './api.js';
import { Info } from './info.js';
import { newLogger } from 'yellow-server-common';
import { statSync } from "fs";

const Log = newLogger('webserver');
const healthcheckLog = newLogger('healthcheck');

export function getGuid(length = 40) {
 let result = '';
 while (result.length < length) result += Math.random().toString(36);
 return result;
}

class WebServer {
 constructor(modules) {
  this.modules = modules;
  /* map from ws to ws_guid */
  this.wsGuids = new Map();
  /* map from ws_guid to client data, including ws and subscriptions */
  this.clients = new Map();
  this.api = new API(this, modules);
 }

 async start() {
  try {
   await this.startServer();
  } catch (ex) {
   Log.error('Cannot start web server.');
   Log.error(ex);
  }
 }

 async startServer() {
  const certs = Info.settings.web.certificates;
  const certs_bun = [];
  if (!Info.settings.web.https_disabled) {
   for (const c of certs) {
    if (!c.domain) {
     Log.error('Error: One of the certificates has a missing domain name in settings file.');
     process.exit(1);
    }
    if (!c.private) {
     Log.error('Error: Private key path for domain ' + c.domain + ' is missing in settings file.');
     process.exit(1);
    }
    if (!c.public) {
     Log.error('Error: Public key path for domain ' + c.domain + ' is missing in settings file.');
     process.exit(1);
    }
    const priv = Bun.file(c.private);
    if (!(await priv.exists())) {
     Log.error('Error: Private key file for domain ' + c.domain + ' cannot be loaded.');
     process.exit(1);
    }
    const pub = Bun.file(c.public);
    if (!(await pub.exists())) {
     Log.error('Error: Public key file for domain ' + c.domain + ' cannot be loaded.');
     process.exit(1);
    }
    certs_bun.push({ key: priv, cert: pub, serverName: c.domain });
   }
  }
  let options = {
   development: true,
   fetch: this.fetch.bind(this),
   port: Info.settings.web.http_port,
   error(error) {
    Log.error(error);
    return new Response(`<pre>${error}\n${error.stack}</pre>`, {
     headers: {
      'Content-Type': 'text/html',
     },
    });
   },
  };
  if (Info.settings.web.standalone) {
   if (!Info.settings.web.https_disabled) {
    Bun.serve(options);
    Log.info('HTTP server is running on port: ' + Info.settings.web.http_port);
    Bun.serve({
     ...options,
     websocket: this.getWebSocket(),
     port: Info.settings.web.https_port,
     tls: certs_bun,
    });
    Log.info('HTTPS server is running on port: ' + Info.settings.web.https_port);
   } else {
    Bun.serve({ ...options, websocket: this.getWebSocket() });
    Log.info('HTTP server is running on port: ' + Info.settings.web.http_port);
   }
  } else {
   const socketPath = Info.settings.web.socket_path.startsWith('/') ? Info.settings.web.socket_path : path.join(Info.appPath, Info.settings.web.socket_path);
   Bun.serve({
    ...options,
    port: undefined,
    websocket: this.getWebSocket(),
    unix: socketPath,
   });
   const fs = require('fs');
   fs.chmodSync(socketPath, '777');
   Log.info('HTTP server is running on Unix socket: ' + socketPath);
  }
 }

 async fetch(req, server) {
  let clientIP0 = server.requestIP(req).address;
  let clientIP = clientIP0;
  const forwardedHeaders = [req.headers.get('x-forwarded-for'), req.headers.get('cf-connecting-ip'), req.headers.get('x-real-ip'), req.headers.get('forwarded'), req.headers.get('x-client-ip'), req.headers.get('x-cluster-client-ip'), req.headers.get('true-client-ip'), req.headers.get('proxy-client-ip'), req.headers.get('wl-proxy-client-ip')];
  for (const header of forwardedHeaders) {
   if (header) {
    clientIP = header.split(',')[0];
    break;
   }
  }
  const url = new URL(req.url);
  let corr = { clientIP0, headers: req.headers, clientIP, url: req.url, method: req.method };
  if (url.pathname === '/health') healthcheckLog.info(corr, req.method + ' request from: ' + clientIP + ', URL: ' + req.url);
  else Log.info(corr, req.method + ' request from: ' + clientIP + ', URL: ' + req.url);
  if (server.protocol === 'https' || Info.settings.web.https_disabled) {
   if (server.upgrade(req, { data: { corr } })) return;
  }
  try {
   if (url.protocol == 'http:' && !Info.settings.web.https_disabled) {
    url.protocol = 'https:';
    if (Info.settings.web.https_port !== 443) {
     url.port = Info.settings.web.https_port;
    } else {
     url.port = '';
    }
    return new Response(null, { status: 301, headers: { Location: url.toString() } });
   } else if (url.pathname == '/health') {
    return new Response('OK', { headers: { 'Content-Type': 'text/plain' } });
   } else {
    return this.getFile(req, corr);
   }
  } catch (ex) {
   console.error(ex);
   return await this.getNotFound(req, corr);
  }
 }

 async handleMessage(corr, ws, message) {
  Log.debug(corr, 'WebSocket message from: ', ws.remoteAddress, ', message: ', message);
  let ws_guid = this.wsGuids.get(ws);
  if (!ws_guid) {
   throw new Error('No ws_guid for ws');
  }
  const res = JSON.stringify(await this.api.processAPI(corr, ws, ws_guid, message));
  Log.debug(corr, 'WebSocket response to: ' + ws.remoteAddress + ', message: ' + res);
  ws.send(res);
 }

 async handleOpen(ws) {
  let ws_guid = getGuid();
  this.clients.set(ws_guid, { ws });
  this.wsGuids.set(ws, ws_guid);
  Log.info(ws.data.corr, 'WebSocket connected: ' + ws.remoteAddress);
 }

 async handleClose(ws, code, message) {
  Log.info(ws.data.corr, 'WebSocket disconnected: ' + ws.remoteAddress + ', code: ' + code + (message ? ', message: ' + message : ''));
  let ws_guid = this.wsGuids.get(ws);
  if (ws_guid) this.clients.delete(ws_guid);
  this.wsGuids.delete(ws);
  await this.modules.notifyModulesOfClientDisconnect(ws_guid);
 }

 getWebSocket() {
  const api = this.api;
  return {
   message: async (ws, message) => {
    let corr = { ...ws.data, clientWsGuid: this.wsGuids[ws], messageGuid: message.guid, requestGuid: getGuid() };
    if (import.meta.env.VITE_YELLOW_DEBUG) {
     await this.handleMessage(corr, ws, message);
    } else {
     try {
      await this.handleMessage(corr, ws, message);
     } catch (ex) {
      Log.error('Error processing WebSocket message:', ex);
     }
    }
   },
   open: async ws => {
    if (import.meta.env.VITE_YELLOW_DEBUG) {
     await this.handleOpen(ws);
    } else {
     try {
      await this.handleOpen(ws);
     } catch (ex) {
      Log.error('Error processing WebSocket open:', ex);
     }
    }
   },
   close: async (ws, code, message) => {
    if (import.meta.env.VITE_YELLOW_DEBUG) {
     await this.handleClose(ws, code, message);
    } else {
     try {
      await this.handleClose(ws, code, message);
     } catch (ex) {
      Log.error('Error processing WebSocket close:', ex);
     }
    }
   },
   drain: ws => {
    // the socket is ready to receive more data
    //console.log('DRAIN', ws);
   },
  };
 }

 async getFile(req, corr = {}) {
  const url = new URL(req.url);
  let fsAbsPathBase = null;
  let urlPathBase = null;
  const sortedPaths = Info.settings.web.web_paths.sort((a, b) => b.route.length - a.route.length);
  Log.info('url.pathname:', url.pathname);

  for (const webPath of sortedPaths) {
   if (url.pathname.startsWith(webPath.route)) {

    /* filesystem absolute path */
    fsAbsPathBase = webPath.path.startsWith('/') ? webPath.path : path.join(Info.appPath, webPath.path);

    /* url path */
    urlPathBase = webPath.route;

    break;
   }
  }

  Log.info('fsAbsPathBase:', fsAbsPathBase);

  /* if no matching item found in web_paths */
  if (!fsAbsPathBase) {
   log.info('no matching item found in web_paths');
   return await this.getNotFound(req, corr);
  }

  let fsAbsPathFull = path.join(fsAbsPathBase, url.pathname.replace(urlPathBase, ''));
  Log.info('fsAbsPathFull:', fsAbsPathFull);

  if (url.pathname.endsWith('/')) url.pathname = path.join(url.pathname, 'index.html');

  else if (statSync(fsAbsPathFull).isDirectory())
  {
   Log.debug('redirect to index.html for directory', fsAbsPathFull);
   let redirect = path.join(url.pathname, '/index.html');
   return new Response(null, { status: 301, headers: { Location: redirect } });
  }

  const file = Bun.file(fsAbsPathFull);
  if (await file.exists()) return new Response(file, { headers: { 'Content-Type': file.type } });
  return await this.getNotFound(req, corr);
 }

 async getNotFound(req, corr = {}) {
  Log.error(corr, 'Not found: ' + req.url);
  //console.log('Not found: ' + req.url);
  const rootPathObj = Info.settings.web.web_paths.find(path => path.route === '/');
  if (rootPathObj) {
   const notFoundFile = Bun.file(path.join(rootPathObj.path, 'notfound.html'));
   if (await notFoundFile.exists()) return new Response(notFoundFile, { headers: { 'Content-Type': 'text/html' } });
  }
  return new Response('<h1>404 Not Found</h1>', { status: 404, headers: { 'Content-Type': 'text/html' } });
 }
}

export default WebServer;
