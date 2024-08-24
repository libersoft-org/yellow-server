# Bugs

# Features

- Fix user logout, admin login and admin logout
- Add new commands to API.js:
  - Admin - Logout - Allow delete only own session IDs
  - Admin - Add / edit / delete admins
  - Admin - Add / edit / delete domains
  - Admin - Add / edit / delete users
  - Admin - When adding admin / domain / user@domain, check if they don't exist first, otherwise throw some error
  - User - Login
  - User - List own sessions
  - User - Logout - Allow delete onl own session IDs
  - User - Send message
  - User - Get other user's info (visible name etc.)
  - User - Get messages - with count, offset
  - User - Subscribe to get new messages
- Add admin + user session cleaner from https://github.com/libersoft-org/telegram-memory-game/blob/main/src/libs/api.js
- Update README.md and INSTALL.md
- Delete ROADMAP.md when it's not needed anymore

# Test

- app.js - loadSettings - test what happens if the settings.json file is not a valid JSON
- webserver.js - startServer - test what happens if some of the certificate file is invalid
