#!/bin/bash

if [ "$#" -eq 0 ]; then
	echo "$0 <domain Name>"
	exit 1
fi

mkdri -p static/.well-known/acme-challenge
mkdir -p cert
certbot --config-dir ./cert --work-dir ./cert --logs-dir ./cert certonly \
		--webroot -w ./static -d "$1"

ln -sv ./cert/live/$1/fullchain.pem .
ln -sv ./cert/live/$1/privkey.pem .
