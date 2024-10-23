#!/bin/sh

[ ! -d "./node_modules/" ] && ../docker-dev-init.sh

bun server.js --create-database
bun --watch server.js
