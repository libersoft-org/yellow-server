#!/bin/sh

~/.bun/bin/bun i --frozen-lockfile
rm -rf ./node_modules/yellow-server-common; ln -s ../../yellow-server-common ./node_modules/yellow-server-common
#~/.bun/bin/bun --bun knex migrate:latest --migrations-directory migrations/

if [ "$CI" = "true" ]; then
  WATCH=""
else
  WATCH="--watch"
fi

while true; do
  ~/.bun/bin/bun $WATCH src/server.js
done
