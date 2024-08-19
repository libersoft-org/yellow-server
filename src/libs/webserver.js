const path = require('path');
const Elysia = require('elysia').Elysia;
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
   cert: Bun.file(path.join(Common.settings.web.certificates_path, 'cert.pem')),
   ca: Bun.file(path.join(Common.settings.web.certificates_path, 'chain.pem'))
  };
  console.log(certs);
  const certs_exist = (await certs.key.exists()) && (await certs.cert.exists()) && (await certs.ca.exists());
  if (!certs_exist) {
   Common.addLog('Error: HTTPS server has not started due to missing certificate files in ' + Common.settings.https_cert_path, 2);
   process.exit(1);
  }
  // TODO: check if certificate is valid
  const app = new Elysia()
   .onRequest(req => {
    console.log(req);
    // TODO: redirect to specific HTTPS port (even other than 443)
    if (req.request.url.startsWith('http://')) return new Response(null, { status: 301, headers: { Location: req.request.url.replace('http://', 'https://') } });
    Common.addLog(req.request.method + ' request from: ' + req.request.headers.get('cf-connecting-ip') + ' (' + (req.request.headers.get('cf-ipcountry') + ')') + ', URL: ' + '/' + req.request.url.split('/').slice(3).join('/'));
   })
   .get('/*', async req => this.getFile(req))
   // TODO: add notfound html
   .ws('/ws', {
    message(ws, message) {
     // TODO: this.api.processAPI(message);
     ws.send({ message, time: Date.now() });
    }
    // TODO: add onConnect, onDisconnect etc.
   });
  if (Common.settings.web.standalone) {
   Bun.serve({ fetch: app.fetch, port: Common.settings.web.http_port });
   Common.addLog('HTTP server is running on port: ' + Common.settings.web.http_port);
   Bun.serve({
    fetch: app.fetch,
    port: Common.settings.web.https_port,
    tls: certs
   });
   Common.addLog('HTTPS server is running on port: ' + Common.settings.web.https_port);
  } else {
   Bun.serve({ fetch: app.fetch, unix: Common.settings.web.socket_path });
   const fs = require('fs');
   fs.chmodSync(Common.settings.web.socket_path, '777');
   Common.addLog('HTTP server is running on Unix socket: ' + Common.settings.web.socket_path);
  }
 }

 async getIndex(req) {
  const content = await Bun.file(path.join(Common.appPath, '../web/index.html')).text();
  return new Response(Common.translate(content, { '{TITLE}': Common.settings.web.name }), { headers: { 'Content-Type': 'text/html' } });
 }

 async getFile(req) {
  const file = Bun.file(path.join(Common.appPath, '../web/', req.path));
  if (!(await file.exists())) return this.getIndex(req);
  else return new Response(file);
 }
}

module.exports = WebServer;
