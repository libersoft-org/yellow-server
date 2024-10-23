#!/bin/sh

pwd

rm -rf ./node_modules
mkdir node_modules
ls -thrlsa ./node_modules/

bun i

rm -rf ./node_modules/yellow-server-common || true
ln -s /app/lib/yellow-server-common ./node_modules/


