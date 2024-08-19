#!/bin/sh

SETTINGS_FILE=settings.json
echo -n "Enter your server domain name (eg.: amtp.domain.tld): "
read DOMAIN
if [ -z $DOMAIN ]; then
 echo ""
 echo "Error: Domain name not entered."
 echo ""
 exit 1
fi

if [ -f $SETTINGS_FILE ]; then
 sed -i "s/{DOMAIN}/$DOMAIN/g" $SETTINGS_FILE
 certbot certonly --standalone --register-unsafely-without-email --agree-tos -d $DOMAIN
else
 echo ""
 echo "Error: cannot find settings file."
 echo ""
 exit 1
fi
