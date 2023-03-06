#!/bin/bash

USER_HOME=$(getent passwd $USER | cut -d: -f6)

# SERVER:

SERVER_INSTALL_DIR=$(whiptail --title "NEMP Server installer" --inputbox "NEMP Server installation directory:" 10 60 "$USER_HOME/nemp" 3>&1 1>&2 2>&3)
if [ -z "$SERVER_INSTALL_DIR" ]; then
 whiptail --msgbox "Invalid installation directory." 10 60
 exit 1
fi
git clone https://github.com/libersoft-org/nemp-server.git
cp -r ./nemp-server/src/* $SERVER_INSTALL_DIR

cd $SERVER_INSTALL_DIR
npm install &
PID=$!
PERCENT=0

function update_progress {
 PERCENT=$(echo "scale=2; $PERCENT + 0.5" | bc)
 echo $PERCENT
}

whiptail --title "Installing npm packages" --gauge "Please wait..." 6 50 0 < <(
 while true; do
  if [[ $(ps -p $PID | grep $PID) ]]; then
   update_progress
   echo "$PERCENT Installing packages... "
  else
   echo "100 Installation complete."
   break
  fi
  sleep 0.1
 done
)

# CLIENTS:

CLIENTS_INSTALL_DIR=$(whiptail --title "NEMP Server installer" --inputbox "NEMP Client installation directory:" 10 60 "$USER_HOME/nemp/www" 3>&1 1>&2 2>&3)
if [ -z "$INSTALL_DIR" ]; then
 whiptail --msgbox "Invalid installation directory." 10 60
 exit 1
fi

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

whiptail --msgbox "Installation done. You can run the server using $SERVER_INSTALL_DIR/start.sh." 10 60

# TODO: Download each client and install it in the web root path
#git clone https://github.com/libersoft-org/nemp-admin-web.git
#mv ./nemp-admin-web/src/* $WEB_PATH/admin/
#rm -rf ./nemp-admin-web

# TODO: show progress bar of git clone & cp
#whiptail --gauge "Installing NEMP Web Admin" 6 60 0

# TODO: add update.sh script too
