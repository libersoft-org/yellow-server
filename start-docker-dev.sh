#!/bin/sh

~/.bun/bin/bun i --frozen-lockfile

echo "CI: $CI"
echo "HOLLOW: $HOLLOW"

if [ "$HOLLOW" = "true" ]; then
 echo "link yellow-server-common for development"
 rm -rf ./node_modules/yellow-server-common; ln -s ../../yellow-server-common ./node_modules/yellow-server-common
fi

#~/.bun/bin/bun --bun knex migrate:latest --migrations-directory migrations/
echo dev_db_init...
./dev_db_init.py `hostname` |  mariadb --protocol=tcp --host=$MARIA_HOST --user=root --password=password --force
~/.bun/bin/bun src/server.js --create-database

#echo migrate...
#~/.bun/bin/bun run knex:migrate || exit 1

./dev_db_populate.py `hostname` |  mariadb --protocol=tcp --host=$MARIA_HOST --user=root --password=password --force

if [ -n "$CI" ]; then
  WATCH=""
else
  WATCH="--watch"
fi

while true; do
  ~/.bun/bin/bun $WATCH src/server.js
  sleep 5
done
