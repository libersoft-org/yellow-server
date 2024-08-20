const path = require('path');
//const Elysia = require('elysia').Elysia;
const API = require('./api.js');
const Common = require('./common.js').Common;

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
  //const app = new Elysia()
  //.onRequest(({ip, req}) => {
  //console.log(req, ip);
  // TODO: redirect to specific HTTPS port (even other than 443)
  //if (req.request.url.startsWith('http://')) return new Response(null, { status: 301, headers: { Location: req.request.url.replace('http://', 'https://') } });
  //Common.addLog(req.request.method + ' request from: ' + this.getIPAddress(req) + ', URL: ' + '/' + req.request.url.split('/').slice(3).join('/'));
  //})
  //.get('/*', async req => {
  //this.getFile(req);
  //console.log(req);
  //});
  // TODO: add notfound html

  if (Common.settings.web.standalone) {
   Bun.serve({
    fetch: this.getFetch(),
    port: Common.settings.web.http_port
   });
   Common.addLog('HTTP server is running on port: ' + Common.settings.web.http_port);
   Bun.serve({
    fetch: this.getFetch(),
    websocket: this.getWebSocket(),
    port: Common.settings.web.https_port,
    tls: certs
   });
   Common.addLog('HTTPS server is running on port: ' + Common.settings.web.https_port);
  } else {
   Bun.serve({
    fetch: this.getFetch(),
    websocket: this.getWebSocket(),
    unix: Common.settings.web.socket_path
   });
   const fs = require('fs');
   fs.chmodSync(Common.settings.web.socket_path, '777');
   Common.addLog('HTTP server is running on Unix socket: ' + Common.settings.web.socket_path);
  }
 }

 getFetch() {
  return (req, server) => {
   console.log(req, server);
   console.log(server.requestIP(req));
   //return new Response('It works!');
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

 async getIndex(req) {
  const content = await Bun.file(path.join(Common.appPath, '../web/index.html')).text();
  return new Response(Common.translate(content, { '{TITLE}': Common.settings.web.name }), { headers: { 'Content-Type': 'text/html' } });
 }
 /*
 async getFile(req) {
  const file = Bun.file(path.join(Common.appPath, '../web/', req.path));
  if (!(await file.exists())) return this.getIndex(req);
  else return new Response(file);
 }
*/
 getIPAddress(req) {
  return req.request.headers.get('cf-connecting-ip') || req.request.headers.get('x-forwarded-for') || req.request.remoteAddress || 'unknown';
 }
}

module.exports = WebServer;
