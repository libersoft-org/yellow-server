#!/bin/bash

USER_HOME=$(getent passwd $USER | cut -d: -f6)

# SERVER:
export NEWT_COLORS='
  window=,black
  border=white,black
  textbox=white,black
  button=black,white'

SERVER_INSTALL_DIR=$(whiptail --title "NEMP Server installer" --inputbox "NEMP Server installation directory:" 15 110 "$USER_HOME/nemp-server" 3>&1 1>&2 2>&3)
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

function update_progress() {
 PERCENT=$(echo "scale=2; $PERCENT + 0.5" | bc)
 echo $PERCENT
}

whiptail --title "Installing npm packages" --gauge "Please wait..." 15 110 0 < <(
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

CLIENTS_INSTALL_DIR=$(whiptail --title "NEMP Server installer" --inputbox "NEMP Client installation directory:" 15 110 "$USER_HOME/data/www" 3>&1 1>&2 2>&3)
if [ -z "$CLIENTS_INSTALL_DIR" ]; then
 whiptail --msgbox "Invalid installation directory." 15 110
 exit 1
fi

CLIENTS=(\
 "1" "('NEMP Web Admin' 'admin' 'libersoft-org' 'nemp-admin-web')" OFF \
 "2" "('NEMP Web Client' 'client' 'libersoft-org' 'nemp-client-web')" OFF \
 "3" "('WebSocket Developer Console' 'console' 'libersoft-org' 'websocket-console')" OFF \
)

CHOICES=$(whiptail --title "What client software would you like to install? " --separate-output --checklist \
"Use spacebar to check:" 15 110 3 "${CLIENTS[@]}" 2>&1 >/dev/tty)

if [ -z "$CHOICES" ]; then
 whiptail --msgbox "Nothing selected" 15 110
 exit 1
fi
# set -x
case $CHOICES in
 1)
    rm ../../data/www/admin -rf && cd ../../data/www && mkdir admin && cd ../../../../
    whiptail --title "Downloading admin web" --gauge "Cloning repository" 6 60 0 < <(
      git clone --progress https://github.com/libersoft-org/nemp-admin-web.git 2>&1 | while read line; do
      percent=$(echo $line | grep -o "[0-9]\{1,3\}%" | tr -d '%')
      percent=${percent:-0}
      sleep 0.15
      done
    )
    cd nemp-admin-web
    mv ./src/* ../../data/www/admin/
    cd ../ && rm nemp-admin-web -rf
   ;;
 2)
    rm ../../data/www/client -rf && cd ../../data/www && mkdir admin && cd ../../../../
    whiptail --title "Downloading client web" --gauge "Cloning repository" 6 60 0 < <(
      git clone --progress https://github.com/libersoft-org/nemp-client-web.git.git 2>&1 | while read line; do
      percent=$(echo $line | grep -o "[0-9]\{1,3\}%" | tr -d '%')
      percent=${percent:-0}
      sleep 0.15
      done
    )
    cd nemp-client-web
    mv ./src/* ../../data/www/client/
    cd ../ && rm nemp-client-web -rf
    ;;
 3)
    rm ../../data/www/console -rf && cd ../../data/www && mkdir console && cd ../../../../
    whiptail --title "Downloading admin web" --gauge "Cloning repository" 6 60 0 < <(
      git clone --progress https://github.com/libersoft-org/websocket-console.git 2>&1 | while read line; do
      percent=$(echo $line | grep -o "[0-9]\{1,3\}%" | tr -d '%')
      percent=${percent:-0}
      sleep 0.15
      done
    )
    cd websocket-console
    mv ./src/* ../../data/www/console/
    cd ../ && rm websocket-console -rf
    ;;
 *) whiptail --msgbox "Invalid choice" 15 110 #todo: add multiple selections later
    ;;
esac
whiptail --msgbox "Installation done. You can run the server using $SERVER_INSTALL_DIR/start.sh." 15 110

# TODO: show progress bar of git clone & cp
#whiptail --gauge "Installing NEMP Web Admin" 6 60 0

# TODO: add update.sh script too
