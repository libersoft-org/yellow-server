const http = require('http');
const https = require('http2');
const http2express = require('http2-express-bridge');
const express = require('express');
const fs = require('fs');
const path = require('path');
const WebSocketServer = require('ws').Server;
const ModulesHandler = require('./modules-handler');
const Settings = require('./settings');
const Logger = require('./utils/logger');

class WebServer {
  constructor() {
    this.logger = new Logger();
    this.settings = new Settings().getAll();
    this.modulesHandler = new ModulesHandler();

    const certPriv = `${this.settings.https_cert_path}privkey.pem`;
    const certPub = `${this.settings.https_cert_path}cert.pem`;
    // const cert_chain = `${this.settings.https_cert_path}chain.pem`;
    let certsExist = false;
    if (fs.existsSync(certPriv) && fs.existsSync(certPub)) certsExist = true;
    if (certsExist) {
      const app = http2express(express);

      app.use((req, res, next) => {
        if (!req.secure) return res.redirect(301, `https://${req.headers.host}:${this.settings.https_port}${req.url}`);
        next();
      });

      app.use(express.static(this.settings.web_root));

      app.use((req, res, next) => {
        let rPath = this.settings.web_root + req.originalUrl;
        rPath = `${rPath.substring(0, rPath.lastIndexOf('/') + 1)}index.html`;
        console.log(rPath);
        if (fs.existsSync(rPath)) res.sendFile(rPath);
        else next();
      });

      app.use((req, res) => { res.sendFile(path.join(__dirname, '../notfound.html')); });

      this.httpServer = http.createServer(app).listen(this.settings.http_port);
      this.logger.log(`[WEBSERVER] HTTP server running on port: ${this.settings.http_port}`);

      this.httpsServer = https.createSecureServer({
        key: fs.readFileSync(certPriv), cert: fs.readFileSync(certPub), allowHTTP1: true,
      }, app).listen(this.settings.https_port);
      this.logger.log(`[WEBSERVER] HTTPS server running on port: ${this.settings.https_port}`);

      this.wss = new WebSocketServer({ server: this.httpsServer });
      this.wss.on('connection', (ws) => { this.wsOnConnection(ws); });
    } else {
      this.logger.error(`[WEBSERVER] HTTPS server has not started due to missing certificate files in ${this.settings.https_cert_path}`);
      process.exit(1);
    }
  }

  wsOnConnection(ws) {
    this.logger.log('[WEBSERVER] WEBSOCKET - CLIENT CONNECTED');
    const websocket = ws;
    websocket.onmessage = async (data) => { this.wsOnMessage(ws, data); };
    websocket.onclose = () => { this.wsOnClose(); };
    websocket.onerror = () => { this.logger.log('WEBSOCKET - CLIENT ERROR'); };
    this.wsSend(ws, JSON.stringify({ server: { name: this.settings.server_name } }));
  }

  async wsOnMessage(ws, e) {
    this.logger.log(`[WEBSERVER] WEBSOCKET - RECEIVED: ${e.data}`);
    this.wsSend(ws, await this.modulesHandler.command(e.data, ws));
  }

  wsOnClose() {
    this.logger.log('[WEBSERVER] WEBSOCKET - CLIENT DISCONNECTED');
  }

  wsSend(ws, data) {
    try {
      this.logger.log(`[WEBSERVER] WEBSOCKET - SENT: ${data}`);
      ws.send(data);
    } catch (ex) {
      this.logger.log(ex);
    }
  }
}

module.exports = WebServer;
