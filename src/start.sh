#!/bin/sh

[ ! -d "./node_modules/" ] && bun i
echo -ne "\033]0;YELLOW SERVER\007"
bun server.js $1
