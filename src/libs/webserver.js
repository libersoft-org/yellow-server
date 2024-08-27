import path from 'path';
import API from './api.js';
import { Common } from './common.js';

class WebServer {
 async run() {
  try {
   this.wsClients = new Map();
   this.api = new API(this);
   await this.startServer();
  } catch (ex) {
   Common.addLog('Cannot start web server.', 2);
   Common.addLog(ex, 2);
  }
 }

 async startServer() {
  const certs = {
   key: Bun.file(path.join(Common.settings.web.certificates_path, 'privkey.pem')),
   cert: Bun.file(path.join(Common.settings.web.certificates_path, 'cert.pem'))
  };
  const certs_exist = (await certs.key.exists()) && (await certs.cert.exists());
  if (!certs_exist) {
   Common.addLog('Error: HTTPS server has not started due to missing certificate files in ' + Common.settings.https_cert_path, 2);
   process.exit(1);
  }
  try {
   if (Common.settings.web.standalone) {
    Bun.serve({ fetch: this.getFetch(), port: Common.settings.web.http_port });
    Common.addLog('HTTP server is running on port: ' + Common.settings.web.http_port);
    Bun.serve({ fetch: this.getFetch(), websocket: this.getWebSocket(), port: Common.settings.web.https_port, tls: certs });
    Common.addLog('HTTPS server is running on port: ' + Common.settings.web.https_port);
   } else {
    const socketPath = Common.settings.web.socket_path.startsWith('/') ? Common.settings.web.socket_path : path.join(Common.appPath, Common.settings.web.socket_path);
    Bun.serve({ fetch: this.getFetch(), websocket: this.getWebSocket(), unix: socketPath });
    const fs = require('fs');
    fs.chmodSync(socketPath, '777');
    Common.addLog('HTTP server is running on Unix socket: ' + socketPath);
   }
  } catch (ex) {
   Common.addLog('Error: ' + ex.message, 2);
   process.exit(1);
  }
 }

 getFetch() {
  return (req, server) => {
   if (server.protocol === 'https' && server.upgrade(req)) return;
   let clientIP = server.requestIP(req).address;
   const forwardedHeaders = [req.headers.get('x-forwarded-for'), req.headers.get('cf-connecting-ip'), req.headers.get('x-real-ip'), req.headers.get('forwarded'), req.headers.get('x-client-ip'), req.headers.get('x-cluster-client-ip'), req.headers.get('true-client-ip'), req.headers.get('proxy-client-ip'), req.headers.get('wl-proxy-client-ip')];
   for (const header of forwardedHeaders) {
    if (header) {
     clientIP = header.split(',')[0];
     break;
    }
   }
   Common.addLog(req.method + ' request from: ' + clientIP + ', URL: ' + req.url);
   const url = new URL(req.url);
   if (url.protocol == 'http:') {
    url.protocol = 'https:';
    if (Common.settings.web.https_port !== 443) url.port = Common.settings.web.https_port;
    else url.port = '';
    return new Response(null, { status: 301, headers: { Location: url.toString() } });
   }
   return this.getFile(req);
  };
 }

 getWebSocket() {
  const api = this.api;
  return {
   message: async (ws, message) => {
    Common.addLog('WebSocket message from: ' + ws.remoteAddress + ', message: ' + message);
    const res = JSON.stringify(await api.processAPI(ws, message));
    Common.addLog('WebSocket message to: ' + ws.remoteAddress + ', message: ' + res);
    ws.send(res);
   },
   open: ws => {
    this.wsClients.set(ws, { subscriptions: new Set() });
    Common.addLog('WebSocket connected: ' + ws.remoteAddress);
   },
   close: (ws, code, message) => {
    this.wsClients.delete(ws);
    Common.addLog('WebSocket disconnected: ' + ws.remoteAddress + ', code: ' + code + (message ? ', message: ' + message : ''));
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
  const sortedPaths = Common.settings.web.web_paths.sort((a, b) => b.route.length - a.route.length);
  for (const webPath of sortedPaths) {
   if (url.pathname.startsWith(webPath.route)) {
    matchedPath = webPath.path.startsWith('/') ? webPath.path : path.join(Common.appPath, webPath.path);
    matchedRoute = webPath.route;
    break;
   }
  }
  if (!matchedPath) return await this.getNotFound();
  if (url.pathname.endsWith('/')) url.pathname = path.join(url.pathname, 'index.html');
  const file = Bun.file(path.join(matchedPath, url.pathname.replace(matchedRoute, '')));
  if (await file.exists()) return new Response(file);
  return await this.getNotFound();
 }

 async getNotFound() {
  const rootPathObj = Common.settings.web.web_paths.find(path => path.route === '/');
  if (rootPathObj) {
   const notFoundFile = Bun.file(path.join(rootPathObj.path, 'notfound.html'));
   if (await notFoundFile.exists()) return new Response(notFoundFile);
  }
  return new Response('<h1>404 Not Found</h1>', { status: 404, headers: { 'Content-Type': 'text/html' } });
 }
}

export default WebServer;
