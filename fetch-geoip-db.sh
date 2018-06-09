#!/bin/sh

url="http://geolite.maxmind.com/download/geoip/database/GeoLite2-Country.tar.gz"
wget -c "$url"

x=$(tar -tf GeoLite2-Country.tar.gz | head -n1)
tar -xvf GeoLite2-Country.tar.gz
mv -vf $x/*.mmdb .

rm -vrf GeoLite2-Country.tar.gz $x
