import path from 'path';
//import API from './api.js';
import { Common } from './common.js';

class WebServer {
 async run() {
  try {
   //this.api = new API();
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
  if (Common.settings.web.standalone) {
   Bun.serve({ fetch: this.getFetch(), port: Common.settings.web.http_port });
   Common.addLog('HTTP server is running on port: ' + Common.settings.web.http_port);
   Bun.serve({ fetch: this.getFetch(), websocket: this.getWebSocket(), port: Common.settings.web.https_port, tls: certs });
   Common.addLog('HTTPS server is running on port: ' + Common.settings.web.https_port);
  } else {
   Bun.serve({ fetch: this.getFetch(), websocket: this.getWebSocket(), unix: Common.settings.web.socket_path });
   const fs = require('fs');
   fs.chmodSync(Common.settings.web.socket_path, '777');
   Common.addLog('HTTP server is running on Unix socket: ' + Common.settings.web.socket_path);
  }
 }

 getFetch() {
  return (req, server) => {
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
  return {
   message(ws, message) {
    // TODO: this.api.processAPI(message);
    ws.send({ message, time: Date.now() });
   },
   open(ws) {
    console.log(ws);
    Common.addLog('Client connected: ' + ws.remoteAddress);
   },
   close(ws, code, message) {
    console.log(ws);
    Common.addLog('Client disconnected: ' + ws.remoteAddress);
   },
   drain(ws) {
    console.log(ws);
    // the socket is ready to receive more data
   }
  };
 }

 async getFile(req) {
  let webRoot = Common.settings.web.root_directory;
  if (!webRoot.startsWith('/')) webRoot = path.join(Common.appPath, webRoot);
  const url = new URL(req.url);
  if (url.pathname.endsWith('/')) url.pathname = path.join(url.pathname, 'index.html');
  const file = Bun.file(path.join(webRoot, url.pathname));
  if (await file.exists()) return new Response(file);
  else {
   const notFile = Bun.file(path.join(webRoot, 'notfound.html'));
   if (await notFile.exists()) return new Response(notFile);
   else return new Response('<h1>404 Not Found</h1>', { status: 404, headers: { 'Content-Type': 'text/html' } });
  }
 }
}

export default WebServer;
