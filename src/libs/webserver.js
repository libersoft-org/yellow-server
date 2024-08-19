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
   private: Common.settings.https_cert_path + 'privkey.pem',
   public: Common.settings.https_cert_path + 'cert.pem',
   chain: Common.settings.https_cert_path + 'chain.pem'
  };
  const certs_exist = (await Bun.file(certs.private).exists()) && (await Bun.file(certs.public).exists()) && (await Bun.file(certs.chain).exists());
  if (!certs_exist) {
   Common.addLog('Error: HTTPS server has not started due to missing certificate files in ' + Common.settings.https_cert_path);
   process.exit(1);
  }
  // TODO: check if certificate is valid
  const app = new Elysia()
   .onRequest(req => {
    let url = '/' + req.request.url.split('/').slice(3).join('/');
    Common.addLog(req.request.method + ' request from: ' + req.request.headers.get('cf-connecting-ip') + ' (' + (req.request.headers.get('cf-ipcountry') + ')') + ', URL: ' + url);
   })
   // if (!req.secure) return res.redirect(301, 'https://' + req.headers.host + ':' + Common.settings.https_port + req.url);
   .get('/*', async req => this.getFile(req))
   .ws('/ws', {
    message(ws, message) {
     ws.send({ message, time: Date.now() }); // TODO: redirect to getAPI
    }
   });
  const server = { fetch: app.fetch };
  if (Common.settings.web.standalone) server.port = Common.settings.web.port;
  else server.unix = Common.settings.web.socket_path;
  Bun.serve(server);
  const fs = require('fs');
  if (!Common.settings.web.standalone) fs.chmodSync(Common.settings.web.socket_path, '777');
  Common.addLog('Web server is running on ' + (Common.settings.web.standalone ? 'port: ' + Common.settings.web.port : 'Unix socket: ' + Common.settings.web.socket_path));
 }

 async getAPI(req, method) {
  return new Response(JSON.stringify(await this.api.processAPI(req.params.name, method == 'POST' ? req.body : req.query)), { headers: { 'Content-Type': 'application/json' } });
 }

 async getIndex(req) {
  const content = await Bun.file(path.join(Common.appPath, '../web/index.html')).text();
  return new Response(
   Common.translate(content, {
    '{TITLE}': Common.settings.web.name
   }),
   { headers: { 'Content-Type': 'text/html' } }
  );
 }

 async getFile(req) {
  const file = Bun.file(path.join(Common.appPath, '../web/', req.path));
  if (!(await file.exists())) return this.getIndex(req);
  else return new Response(file);
 }
}

module.exports = WebServer;

/*
class WebServer {
 constructor() {
  const certs = {
   private: 'privkey.pem',
   public: 'cert.pem',
   chain: 'chain.pem'
  }
  let certs_exist = false;
  if (Bun.existsSync(Common.settings.https_cert_path + certs.private) && Bun.existsSync(Common.settings.https_cert_path + certs.public) && Bun.existsSync(Common.settings.https_cert_path + certs.chain)) certs_exist = true;
  if (certs_exist) {
   app.use((req, res, next) => {
    if (!req.secure) return res.redirect(301, 'https://' + req.headers.host + ':' + Common.settings.https_port + req.url);
    next();
   });
   app.use(express.static(Common.settings.web_root));
   app.use((req, res, next) => {
    let path = Common.settings.web_root + req.originalUrl;
    path = path.substring(0, path.lastIndexOf('/') + 1) + 'index.html';
    if (Bun.existsSync(path)) res.sendFile(path);
    else next();
   });
   app.use((req, res) => { res.sendFile(path.join(Common.appPath, '../notfound.html')); });
   this.httpServer = http.createServer(app).listen(Common.settings.http_port);
   Common.addLog('HTTP server running on port: ' + Common.settings.http_port);
   this.httpsServer = https.createSecureServer({ key: Bun.readFileSync(cert_priv), cert: Bun.readFileSync(cert_pub), ca: Bun.readFileSync(cert_chain), allowHTTP1: true }, app).listen(Common.settings.https_port);
   Common.addLog('HTTPS server running on port: ' + Common.settings.https_port);
   this.protocol = new API();
   this.wss = new WebSocketServer({ server: this.httpsServer });
   this.wss.on('connection', ws => { this.wsOnConnection(ws) });
  } else {
   Common.addLog('Error: HTTPS server has not started due to missing certificate files in ' + Common.settings.https_cert_path);
   process.exit(1);
  }
 };

 wsOnConnection(ws) {
  Common.addLog('WEBSOCKET - CLIENT CONNECTED');
  ws.onmessage = async (data) => { this.wsOnMessage(ws, data) };
  ws.onclose = () => { this.wsOnClose(); };
  ws.onerror = () => { Common.addLog('WEBSOCKET - CLIENT ERROR'); }
  this.wsSend(ws, JSON.stringify({server: {name: Common.appName, version: Common.appVersion}}));
 }

 async wsOnMessage(ws, e) {
  Common.addLog('WEBSOCKET - RECEIVED: ' + e.data);
  this.wsSend(ws, await this.protocol.protocolHandler(e.data)
  ||
  await this.protocol.data.identity_protocol.protocolHandler(e.data)
  );
 }

 wsOnClose() {
  Common.addLog('WEBSOCKET - CLIENT DISCONNECTED');
 }

 wsSend(ws, data) {
  try {
   Common.addLog('WEBSOCKET - SENT: ' + data);
   ws.send(data);
  } catch(ex) {
   Common.addLog(ex);
  }
 }
}
 */
