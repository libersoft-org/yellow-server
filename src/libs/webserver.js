const http = require('http');
const https = require('http2');
const http2express = require('http2-express-bridge');
const express = require('express');
const fs = require('fs');
const path = require('path');
const WebSocketServer = require('ws').Server;
const Common = require('./common.js').Common;
const Protocol = require('./core/protocol.js');
const mime = require('mime-types');

class WebServer {
 constructor() {
  var cert_priv = Common.settings.https_cert_path + 'privkey.pem';
  var cert_pub = Common.settings.https_cert_path + 'cert.pem';
  var cert_chain = Common.settings.https_cert_path + 'chain.pem';
  var certs_exist = false;
  if (fs.existsSync(cert_priv) && fs.existsSync(cert_pub) && fs.existsSync(cert_chain)) certs_exist = true;
  if (certs_exist) {
   const app = http2express(express);
   if (Common.settings.http_run) {
    app.use((req, res, next) => {
     if (!req.secure) return res.redirect(301, 'https://' + req.headers.host + ':' + Common.settings.https_port + req.url);
     next();
    });
   }
   const customMiddleware = (req, res) => {
    const pathParts = req.path.split("/");
    const firstPath = pathParts.slice(0, 2).join("/");
    if (firstPath === "/") {
      return res.sendFile(
        path.join(__dirname, "..", Common.settings.web_notfound_path, "index.html")
      );
    }
    const staticPath = Common.settings.web_root + `/${firstPath}`;
    const filePath = path.join(staticPath, "index.html");
    fs.stat(filePath, (err, stats) => {
        if(err || !stats.isFile()) {
            return res.sendFile(
              path.join(__dirname, "..", Common.settings.web_notfound_path, "index.html")
            );
          }
          function trimFile(file_path) {
            if(file_path.endsWith('/')) file_path = file_path.substring(0, file_path.length - 1);
            const segments = file_path.split('/');
            const lastDir = segments[segments.length - 2];
            const lastDirFile = segments[segments.length - 1];
            return path.join(staticPath, lastDir, lastDirFile);
          }
          let url = req.path;
          if(req.path.endsWith('/')) url = req.path.substring(0, req.path.length - 1);
          if(
            url.endsWith(".js") || 
            url.endsWith(".css") || 
            url.endsWith(".svg") || 
            (url.endsWith(".html") || 
            url.endsWith(".svg"))) {
            return res.sendFile(trimFile(url));
          }
          return res.sendFile(filePath);
      });
   };
   app.use(customMiddleware);    
   app.use('*', express.static(Common.settings.web_notfound_path));
   if (Common.settings.http_run) {
    this.httpServer = http.createServer(app).listen(Common.settings.http_port);
    Common.addLog('HTTP server running on port: ' + Common.settings.http_port);
   }
   this.httpsServer = https.createSecureServer({ key: fs.readFileSync(cert_priv), cert: fs.readFileSync(cert_pub), ca: fs.readFileSync(cert_chain), allowHTTP1: true }, app).listen(Common.settings.https_port);
   Common.addLog('HTTPS server running on port: ' + Common.settings.https_port);
  } else {
   Common.addLog('Error: HTTPS server has not started due to missing certificate files in ' + Common.settings.https_cert_path);
   process.exit(1);
  }
  this.protocol = new Protocol();
  this.wss = new WebSocketServer({ server: this.httpsServer });
  this.wss.on('connection', ws => { this.wsOnConnection(ws) });
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
  this.wsSend(ws, await this.protocol.protocolHandler(e.data));
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

module.exports = WebServer;
