#!/bin/bash

#screen -mS yellow-server bash -c "screen bash& ./start-hot.sh "

screen -dmS yellow-server bash -c "trap bash SIGINT; (./start-hot.sh ; bash);"
