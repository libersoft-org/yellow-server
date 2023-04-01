const http = require('http');
const https = require('http2');
const http2express = require('http2-express-bridge');
const express = require('express');
const fs = require('fs');
const path = require('path');
const WebSocketServer = require('ws').Server;
const mime = require('mime-types');
const { Common } = require('../old/common.js');
const Protocol = require('./protocol.js');

class WebServer {
  constructor() {
    this.protocol = new Protocol();

    const cert_priv = `${Common.settings.https_cert_path}privkey.pem`;
    const cert_pub = `${Common.settings.https_cert_path}cert.pem`;
    // const cert_chain = `${Common.settings.https_cert_path}chain.pem`;
    let certs_exist = false;
    if (fs.existsSync(cert_priv) && fs.existsSync(cert_pub)) certs_exist = true;
    if (certs_exist) {
      const app = http2express(express);
      app.use((req, res, next) => {
        if (!req.secure) return res.redirect(301, `https://${req.headers.host}:${Common.settings.https_port}${req.url}`);
        next();
      });
      app.use(express.static(Common.settings.web_root));
      app.use((req, res, next) => {
        let path = Common.settings.web_root + req.originalUrl;
        path = `${path.substring(0, path.lastIndexOf('/') + 1)}index.html`;
        console.log(path);
        if (fs.existsSync(path)) res.sendFile(path);
        else next();
      });
      app.use((req, res) => { res.sendFile(path.join(__dirname, '../notfound.html')); });
      this.httpServer = http.createServer(app).listen(Common.settings.http_port);
      Common.addLog(`HTTP server running on port: ${Common.settings.http_port}`);
      this.httpsServer = https.createSecureServer({
        key: fs.readFileSync(cert_priv), cert: fs.readFileSync(cert_pub), allowHTTP1: true,
      }, app).listen(Common.settings.https_port);
      Common.addLog(`HTTPS server running on port: ${Common.settings.https_port}`);
      this.wss = new WebSocketServer({ server: this.httpsServer });
      this.wss.on('connection', (ws) => { this.wsOnConnection(ws); });
    } else {
      Common.addLog(`Error: HTTPS server has not started due to missing certificate files in ${Common.settings.https_cert_path}`);
      process.exit(1);
    }
  }

  wsOnConnection(ws) {
    Common.addLog('WEBSOCKET - CLIENT CONNECTED');
    ws.onmessage = async (data) => { this.wsOnMessage(ws, data); };
    ws.onclose = () => { this.wsOnClose(); };
    ws.onerror = () => { Common.addLog('WEBSOCKET - CLIENT ERROR'); };
    this.wsSend(ws, JSON.stringify({ server: { name: Common.appName, version: Common.appVersion } }));
  }

  async wsOnMessage(ws, e) {
    Common.addLog(`WEBSOCKET - RECEIVED: ${e.data}`);
    this.wsSend(ws, await this.protocol.protocolHandler(e.data)
  || await this.protocol.data.identity_protocol.protocolHandler(e.data));
  }

  wsOnClose() {
    Common.addLog('WEBSOCKET - CLIENT DISCONNECTED');
  }

  wsSend(ws, data) {
    try {
      Common.addLog(`WEBSOCKET - SENT: ${data}`);
      ws.send(data);
    } catch (ex) {
      Common.addLog(ex);
    }
  }
}

module.exports = WebServer;
