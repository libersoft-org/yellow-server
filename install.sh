#!/bin/bash

WEB_PATH=/var/www/nemp
CLIENTS=(\
 '1=("NEMP Web Admin" "admin" "libersoft-org" "nemp-admin-web")'\
 '2=("NEMP Web Client" "client" "libersoft-org" "nemp-client-web")'\
 '3=("WebSocket Developer Console" "console" "libersoft-org" "websocket-console")'\
)

whiptail \
--title "NEMP client software installer" \
--checklist "\nWhat client software would you like to install on NEMP web server?" 13 40 ${#CLIENTS[@]} \
1 "NEMP Web Admin" ON \
2 "NEMP Web Client" ON \
3 "WebSocket Developer Console" ON

# TODO: Ask for web root path
# TODO: Download each client and install it in the web root path

#whiptail --gauge "Installing NEMP Web Admin" 6 60 0

#git clone https://github.com/libersoft-org/nemp-admin-web.git
#mv ./nemp-admin-web/src/* $WEB_PATH/admin/
#rm -rf ./nemp-admin-web
