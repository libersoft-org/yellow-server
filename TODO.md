# Bugs

- log is in "libs" directory for some reason instead of root (settings.json is in correct directory)

# Features

- webserver.js - redirect HTTP to specific HTTPS port (even other than 443)
- Convert API.js to Bun
- webserver.js - add 404 page (notfound.html);
- webserver.js - connect messages with this.api.getAPI
- webserver.js - WebSocket - add onConnect, onDisconnect etc.
- Update README.md and INSTALL.md
- Delete ROADMAP.md when it's not needed anymore

# Test

- app.js - loadSettings - test what happens if the settings.json file is not a valid JSON
- webserver.js - startServer - test what happens if some of the certificate file is invalid
