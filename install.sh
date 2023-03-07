#!/bin/bash

USER_HOME=$(getent passwd $USER | cut -d: -f6)

# SERVER:

SERVER_INSTALL_DIR=$(whiptail --title "NEMP Server installer" --inputbox "NEMP Server installation directory:" 10 60 "$USER_HOME/nemp-server" 3>&1 1>&2 2>&3)
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

CLIENTS_INSTALL_DIR=$(whiptail --title "NEMP Server installer" --inputbox "NEMP Client installation directory:" 10 60 "../data/www" 3>&1 1>&2 2>&3)
if [ -z "$CLIENTS_INSTALL_DIR" ]; then
 whiptail --msgbox "Invalid installation directory." 10 60
 exit 1
fi

CLIENTS=(\
 "1" "('NEMP Web Admin' 'admin' 'libersoft-org' 'nemp-admin-web')" OFF \
 "2" "('NEMP Web Client' 'client' 'libersoft-org' 'nemp-client-web')" OFF \
 "3" "('WebSocket Developer Console' 'console' 'libersoft-org' 'websocket-console')" OFF \
)

CHOICES=$(whiptail --title "What client software would you like to install? " --separate-output --checklist \
"Use spacebar to check:" 10 60 3 "${CLIENTS[@]}" 2>&1 >/dev/tty)

# Print the selected options
echo "Selected options:" $CHOICES
if [ -z "$CHOICES" ]; then
 whiptail --msgbox "Nothing selected" 10 60
 exit 1
fi
case $CHOICES in
 1) whiptail --msgbox "installing admin web...." 10 60
    rm ../../data/www/admin -rf
    cd ../../data/www && mkdir admin && cd ../../../../
    ls ../../data/www/admin
    git clone https://github.com/libersoft-org/nemp-admin-web.git
    cd nemp-admin-web
    mv ./src/* ../../data/www/admin/
    PID=$!
    PERCENT=0
    cd ../ && rm nemp-admin-web -rf
    echo "Web admin installed successfully"
    ;;
 2) whiptail --msgbox "installing client web...." 10 60
    echo "You chose the second option"
    ;;
 3)  whiptail --msgbox "installing web console...." 10 60
    # do something for the third choice
    # git clone client-web here
    ;;
 *) whiptail --msgbox "Invalid choice" 10 60
    ;;
esac
whiptail --msgbox "Installation done. You can run the server using $SERVER_INSTALL_DIR/start.sh." 10 60

# TODO: Download each client and install it in the web root path
#git clone https://github.com/libersoft-org/nemp-admin-web.git
#mv ./nemp-admin-web/src/* $WEB_PATH/admin/
#rm -rf ./nemp-admin-web

# TODO: show progress bar of git clone & cp
#whiptail --gauge "Installing NEMP Web Admin" 6 60 0

# TODO: add update.sh script too
