# BUGS
- create admin from command line after database is created
- subpages in webmail/webadmin/console not working (nested function did not found Common class) - webserver.js:26
- don't crash app on websocket (and webrequest?) invalid request
- web admin - footer on bigger resolutions is not on center
- web admin - login button does not work again after unsuccessful login
- time in DB should be always UTC and appear on web in local time shift
- fix SQL injections (if any)
- https not working on other ports than 443
- fix Common.sysinfo.uptime (shows nonsense like this: '2 days, 59 hours, 17 minutes, 16 seconds')
- when menu is hidden on mobile size and then window resized to desktop, menu is missing

# NEW
- web console - prefify the json commands (if it's not a valid json, just show it normaly) - http://jsfiddle.net/KJQ9K/554/
- web admin URL paths (eg. /webadmin/domains, /webadmin/stats etc...)
- web admin - stats
- web admin - users - add dialog
- web admin - users - edit dialog
- web admin - users - delete dialog
- web admin - users - add number of messages to table
- web admin - users - add files size to table
- web admin - users - photos to table
- web admin - domains - add dialog
- web admin - domains - edit dialog
- web admin - domains - delete dialog
- web admin - aliases - add dialog
- web admin - aliases - edit dialog
- web admin - aliases - delete dialog
- web admin - admins - add dialog
- web admin - admins - edit dialog
- web admin - admins - delete dialog
- web admin - admins - deny delete last admin
- web admin - stats - add disk drives usage
- web admin - stats - add network usage
- favicon and other icons
- web mail and web admin language translations
- mysql and pgsql support
- end to end messages encryption - probably ECC and RSA for start (+ files, contact list)
- add webserver access and error log
- unit tests