#!/bin/sh

[ ! -d "./node_modules/" ] && ~/.bun/bin/bun i --frozen-lockfile
rm -rf ./node_modules/yellow-server-common; ln -s ../../../yellow-server-common ./node_modules/yellow-server-common
~/.bun/bin/bun server.js --create-database
while true; do
  ~/.bun/bin/bun --watch server.js
done
