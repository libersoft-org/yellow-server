# Bugs

# Features

- webserver.js - replace Elysia with own middleware (almost done, add file fetch)
- webserver.js - redirect HTTP to specific HTTPS port (even other than 443)
- webserver.js - add 404 page (notfound.html);
- webserver.js - connect messages with this.api.getAPI
- Convert API.js to Bun
- Update README.md and INSTALL.md
- Delete ROADMAP.md when it's not needed anymore

# Test

- app.js - loadSettings - test what happens if the settings.json file is not a valid JSON
- webserver.js - startServer - test what happens if some of the certificate file is invalid
