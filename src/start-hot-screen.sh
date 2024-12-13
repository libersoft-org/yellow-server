#!/bin/sh

bun i
screen -dmS yellow-server bash -c '
echo -ne "\033]0;YELLOW SERVER\007"
bun --watch server.js
'
