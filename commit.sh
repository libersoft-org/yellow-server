#!/bin/bash

REPO=nemp-server.git
NAME="Liberland Software Foundation"
EMAIL="info@libersoft.org"
USER=libersoft-org
PASS=`cat ./.secret_git`

if [ "$#" -eq 0 ]; then
 echo ""
 echo "------------------------"
 echo "Git commit & push script"
 echo "------------------------"
 echo ""
 echo "This script commits changes and pushes it on GitHub."
 echo ""
 echo "Usage: $0 \"[SOME COMMENT]\""
 echo "Example: $0 \"Add README.md\""
 echo ""
 exit 1
fi

if [ ! -d "./.git/" ]; then
 git init
 git remote add origin https://$USER:$PASS@github.com/$USER/$REPO
fi
git status
git add .
git status
git config user.name "$NAME"
git config user.email "$EMAIL"
git commit -m "$1"
git branch -M main
git push -u origin main
git status
