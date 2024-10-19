import path from 'path';
import API from './api.js';
import { Info } from './info.js';
import { Log } from 'yellow-server-common';

class WebServer {
 async start() {
  try {
   this.wsClients = new Map();
   this.api = new API(this);
   await this.startServer();
  } catch (ex) {
   Log.error('Cannot start web server.');
   Log.error(ex);
  }
 }

 async startServer() {
  let certs = null;
  if (!Info.settings.web.https_disabled) {
   certs = {
    key: Bun.file(path.join(Info.settings.web.certificates_path, 'privkey.pem')),
    cert: Bun.file(path.join(Info.settings.web.certificates_path, 'cert.pem'))
   };
   const certs_exist = (await certs.key.exists()) && (await certs.cert.exists());
   if (!certs_exist) {
    Log.error('Error: HTTPS server has not started due to missing certificate files in ' + Info.settings.https_cert_path);
    process.exit(1);
   }
  }
  try {
   if (Info.settings.web.standalone) {
    if (!Info.settings.web.https_disabled) {
     Bun.serve({
      fetch: this.getFetch(),
      port: Info.settings.web.http_port,
     });
     Log.info('HTTP server is running on port: ' + Info.settings.web.http_port);
     Bun.serve({
      fetch: this.getFetch(),
      websocket: this.getWebSocket(),
      port: Info.settings.web.https_port,
      tls: certs
     });
     Log.info('HTTPS server is running on port: ' + Info.settings.web.https_port);
    }
    else
    {
     Bun.serve({
      fetch: this.getFetch(),
      websocket: this.getWebSocket(),
      port: Info.settings.web.http_port,
     });
     Log.info('HTTP server is running on port: ' + Info.settings.web.http_port);
    }
   } else {
    const socketPath = Info.settings.web.socket_path.startsWith('/') ? Info.settings.web.socket_path : path.join(Info.appPath, Info.settings.web.socket_path);
    Bun.serve({
     fetch: this.getFetch(),
     websocket: this.getWebSocket(),
     unix: socketPath
    });
    const fs = require('fs');
    fs.chmodSync(socketPath, '777');
    Log.info('HTTP server is running on Unix socket: ' + socketPath);
   }
  } catch (ex) {
   Log.error(ex.message);
   process.exit(1);
  }
 }

 getFetch() {
  return async (req, server) => {
   if ((server.protocol === 'https' || Info.settings.web.https_disabled) && server.upgrade(req)) return;
   let clientIP = server.requestIP(req).address;
   const forwardedHeaders = [req.headers.get('x-forwarded-for'), req.headers.get('cf-connecting-ip'), req.headers.get('x-real-ip'), req.headers.get('forwarded'), req.headers.get('x-client-ip'), req.headers.get('x-cluster-client-ip'), req.headers.get('true-client-ip'), req.headers.get('proxy-client-ip'), req.headers.get('wl-proxy-client-ip')];
   for (const header of forwardedHeaders) {
    if (header) {
     clientIP = header.split(',')[0];
     break;
    }
   }
   Log.info(req.method + ' request from: ' + clientIP + ', URL: ' + req.url);
   try {
    const url = new URL(req.url);
    if (url.protocol == 'http:' && !Info.settings.web.https_disabled) {
     url.protocol = 'https:';
     if (Info.settings.web.https_port !== 443)
     {
      url.port = Info.settings.web.https_port;
     }
     else
     {
      url.port = '';
     }
     return new Response(null, { status: 301, headers: { Location: url.toString() } });
    }
    else {
     return this.getFile(req);
    }
   } catch (ex) {
    Log.error('Invalid URL: ' + req.url);
    return await this.getNotFound();
   }
  };
 }

 getWebSocket() {
  const api = this.api;
  return {
   message: async (ws, message) => {
    Log.info('WebSocket message from: ' + ws.remoteAddress + ', message: ' + message);
    const res = JSON.stringify(await api.processAPI(ws, message));
    Log.info('WebSocket message to: ' + ws.remoteAddress + ', message: ' + res);
    ws.send(res);
   },
   open: ws => {
    this.wsClients.set(ws, { subscriptions: new Set() });
    Log.info('WebSocket connected: ' + ws.remoteAddress);
   },
   close: (ws, code, message) => {
    this.wsClients.delete(ws);
    Log.info('WebSocket disconnected: ' + ws.remoteAddress + ', code: ' + code + (message ? ', message: ' + message : ''));
   },
   drain: ws => {
    // the socket is ready to receive more data
    console.log('DRAIN', ws);
   }
  };
 }

 async getFile(req) {
  const url = new URL(req.url);
  let matchedPath = null;
  let matchedRoute = null;
  const sortedPaths = Info.settings.web.web_paths.sort((a, b) => b.route.length - a.route.length);
  for (const webPath of sortedPaths) {
   if (url.pathname.startsWith(webPath.route)) {
    matchedPath = webPath.path.startsWith('/') ? webPath.path : path.join(Info.appPath, webPath.path);
    matchedRoute = webPath.route;
    break;
   }
  }
  if (!matchedPath) return await this.getNotFound();
  if (url.pathname.endsWith('/')) url.pathname = path.join(url.pathname, 'index.html');
  const file = Bun.file(path.join(matchedPath, url.pathname.replace(matchedRoute, '')));
  if (await file.exists()) return new Response(file, { headers: { 'Content-Type': file.type } });
  return await this.getNotFound();
 }

 async getNotFound() {
  const rootPathObj = Info.settings.web.web_paths.find(path => path.route === '/');
  if (rootPathObj) {
   const notFoundFile = Bun.file(path.join(rootPathObj.path, 'notfound.html'));
   if (await notFoundFile.exists()) return new Response(notFoundFile, { headers: { 'Content-Type': 'text/html' } });
  }
  return new Response('<h1>404 Not Found</h1>', { status: 404, headers: { 'Content-Type': 'text/html' } });
 }
}

export default WebServer;
