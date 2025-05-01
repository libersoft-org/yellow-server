#!/bin/sh

bun i --frozen-lockfile
echo -ne "\033]0;YELLOW SERVER\007"
bun src/server.js $1
