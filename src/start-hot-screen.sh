#!/bin/sh

[ ! -d "./node_modules/" ] && bun i
screen -dmS yellow-server bun --watch server.js
