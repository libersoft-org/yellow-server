#!/bin/sh

[ ! -d "./node_modules/" ] && ../docker-dev-init.sh

echo RUN BUN

bun --watch server.js
