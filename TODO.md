# Bugs

# Features

- Fix user logout, admin login and admin logout
- Add new commands to API.js:
  - Admin - Logout - Allow delete only own session IDs
  - Admin - Edit / delete admins
  - Admin - Edit / delete domains
  - Admin - Edit users
  - User - Login
  - User - List own sessions
  - User - Logout - Allow delete only own session IDs
  - User - Send message
  - User - Get other user's info (visible name etc.)
  - User - Get messages - with count, offset
  - User - Subscribe to get new messages
- Add admin + user session cleaner from https://github.com/libersoft-org/telegram-memory-game/blob/main/src/libs/api.js
- Update README.md, INSTALL.md, SERVER.md

# Test

- app.js - loadSettings - test what happens if the settings.json file is not a valid JSON
- webserver.js - startServer - test what happens if some of the certificate file is invalid
