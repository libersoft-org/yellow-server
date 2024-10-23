#!/bin/sh
bun i

rm -rf ./node_modules/yellow-server-common || true
ln -s ../../../yellow-server-common ./node_modules/


