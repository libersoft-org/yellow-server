#!/bin/sh

[ ! -d "./node_modules/" ] && bun i
screen -dmS yellow-server bun --watch yellow-server.js
