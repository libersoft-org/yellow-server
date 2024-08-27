#!/bin/sh

[ ! -d "./node_modules/" ] && bun i
bun server.js $1
