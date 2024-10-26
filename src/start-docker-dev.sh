#!/bin/sh

[ ! -d "./node_modules/" ] && bun i

rm -rf ./node_modules/yellow-server-common; ln -s ../../../yellow-server-common ./node_modules/yellow-server-common


bun server.js --create-database
bun --watch server.js
