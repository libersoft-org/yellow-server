#!/bin/sh

bun i --frozen-lockfile
echo -ne "\033]0;YELLOW SERVER\007"
bun server.js $1
