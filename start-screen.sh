#!/bin/sh

bun i --frozen-lockfile
screen -dmS yellow-server bash -c '
echo -ne "\033]0;YELLOW SERVER\007"
while true; do
 bun src/server.js || exit 1
done
'
