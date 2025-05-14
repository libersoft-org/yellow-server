#!/bin/sh

~/.bun/bin/bun i --frozen-lockfile
rm -rf ./node_modules/yellow-server-common; ln -s ../../yellow-server-common ./node_modules/yellow-server-common
#~/.bun/bin/bun --bun knex migrate:latest --migrations-directory migrations/

echo "CI: $CI"
echo "CI raw: |$CI|"
if [ -n "$CI" ]; then
  echo dev_db_init...
  ./dev_db_init.py `hostname` |  mariadb --protocol=tcp --host=localhost --user=root --password=password --force
  ~/.bun/bin/bun src/server.js --create-database
fi

#echo migrate...
#~/.bun/bin/bun run knex:migrate || exit 1

if [ -n "$CI" ]; then
  echo populate...
  ./dev_db_populate.py `hostname` |  mariadb --protocol=tcp --host=localhost --user=root --password=password --force
fi

if [ -n "$CI" ]; then
  WATCH=""
else
  WATCH="--watch"
fi

while true; do
  ~/.bun/bin/bun $WATCH src/server.js
done
