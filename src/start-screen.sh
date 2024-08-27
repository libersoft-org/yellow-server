#!/bin/sh

[ ! -d "./node_modules/" ] && bun i
screen -dmS yellow-server bash -c '
while true; do
 bun server.js || exit 1
done
'
