# Bugs

- When HTTPS server is running on a different port than 443, it does not work

# Features

- Fix user logout, admin login and admin logout
- Add new commands to API.js
- Add admin + user session cleaner from https://github.com/libersoft-org/telegram-memory-game/blob/main/src/libs/api.js
- Update README.md and INSTALL.md
- Delete ROADMAP.md when it's not needed anymore

# Test

- app.js - loadSettings - test what happens if the settings.json file is not a valid JSON
- webserver.js - startServer - test what happens if some of the certificate file is invalid
