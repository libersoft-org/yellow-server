#!/bin/sh

[ ! -d "./node_modules/" ] && bun i
bun yellow-server.js $1
