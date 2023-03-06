#!/bin/bash

WEB_PATH=/var/www/nemp

export NCURSES_NO_UTF8_ACS=1

whiptail \
--title "NEMP client software installer" \
--checklist "What client software you would like to install on NEMP web server?" 13 40 3 \
1 "NEMP Web Admin" ON \
2 "NEMP Web Client" ON \
3 "NEMP Web Developer Console" ON

whiptail --gauge "Installing NEMP Web Admin" 6 60 0

#git clone https://github.com/libersoft-org/nemp-admin-web.git
#mv ./nemp-admin-web/src/* $WEB_PATH/admin/
#rm -rf ./nemp-admin-web

#git clone https://github.com/libersoft-org/nemp-client-web.git
#mv ./nemp-client-web/src/* $WEB_PATH/client/
#rm -rf ./nemp-client-web

#git clone https://github.com/libersoft-org/websocket-console.git
#mv ./websocket-console/src/* $WEB_PATH/console/
#rm -rf ./websocket-console
