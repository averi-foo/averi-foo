#!/bin/bash
# set -e exits if one part of the script fails
set -e

# Averi.foo auto install script. Written by Lachlan (s5lachlan)
# Can be used standalone or as part of the repo
# To use standalone, curl onto a machine, and ./install.sh

# Recommended: 
# curl -o- https://raw.githubusercontent.com/averi-foo/averi-foo/main/install.sh | bash

# Alternatively: Git clone averi-foo into /var/www/ then run script
# git clone https://github.com/averi-foo/averi-foo /var/www/averi-foo
# chmod -R www-data:www-data /var/www/averi-foo
# cd /var/www/averi-foo
# ./install.sh

# To get access to the folder as an admin run
# sudo usermod -a -G $USER www-data
# newgrp www-data

# Edit the variables below, if you wish
# DO NOT USE THESE VARIABLES ON YOUR PROD SERVER

MONGODB_PASSWORD="changeme_mongodbpass123"
REDIS_PASSWORD="changeme_redispass123"
DATABASE_NAME="jschan"
DATABASE_USERNAME="jschan"
REDIS_PORT="6379"
MONGODB_PORT="27017"
HOST_IP="127.0.0.1"
HOST_PORT="7000"
COOKIESECRET="changeme"
TRIPCODESECRET="changeme"
IPHASHSECRET="changeme"
POSTPASSWORDSECRET="changeme"

AVFOO_FOLDER=/var/www/averi-foo

if [[ $EUID -eq 0 ]]; then
	echo -e "Please do not run this script as root or with sudo. Only some commands need sudo in the script, run normally and input your password when it comes to them."
	exit 1
fi

# Check arguments

for arg in "$@"; do
    case $arg in
        --stage=*)
            "${arg#*=}"
            exit
            ;;
		--help)
            echo "Usage: ./install.sh <flags>"
            echo "Flags: "
            echo "--help: Displays help."
            echo "--stage: Run specific function, e.g --stage=run_install_dependencies"
            exit
            ;;
        *)
            echo "Unknown argument: $arg"
            echo "For usage, run ./install.sh --help"
            exit 1
            ;;
    esac
done

echo "Ensuring permissions for the /var/www folder are correct..."
echo "If prompted, please input your password."
sudo mkdir -p /var/www
sudo chown -R www-data:www-data /var/www

if [[ "$(pwd)" != "/var/www/averi-foo" && -f server.js ]]; then
    read -p "Move current folder $(pwd) into /var/www/ ? (y/n)" MOVE_CURRENT_FOLDER
    AVFOO_FOLDER="/var/www/$(basename $(pwd))"
    [[ "$MOVE_CURRENT_FOLDER" == "y" ]] && sudo mv "$(pwd)" /var/www/ && sudo chown -R www-data:www-data $AVFOO_FOLDER && cd $AVFOO_FOLDER && sudo usermod -a -G $USER www-data && git config --global --add safe.directory $AVFOO_FOLDER
fi

if [[ "$(pwd)" != "/var/www/averi-foo" && ! -f server.js ]]; then
    read -p "Git clone averi-foo into /var/www/ ? (y/n)" GIT_CLONE_AVERI_FOO
	[[ "$GIT_CLONE_AVERI_FOO" == "y" ]] && sudo git clone https://github.com/averi-foo/averi-foo /var/www/averi-foo && sudo chown -R www-data:www-data /var/www/averi-foo && cd /var/www/averi-foo && sudo usermod -a -G $USER www-data && git config --global --add safe.directory $AVFOO_FOLDER

fi

if [[ ! -f "server.js" ]]; then
	echo "Server.js not detected, are you sure you are in the averi-foo folder?"
	exit 1
fi

read -p "Configure secrets instead of using defaults? (y/n): " CONFIG_SECRETS_BOOL

if [ "$CONFIG_SECRETS_BOOL" == "y" ]; then
	read -p "Enter your host IP (usually 127.0.0.1. blank/default: $HOST_IP)" NEW_HOST_IP
	read -p "Enter your backend host port (usually 7000. blank/default: $HOST_PORT)" NEW_HOST_PORT
	
	read -p "Enter your desired database name (blank/default: $DATABASE_NAME)" NEW_DATABASE_NAME
	read -p "Enter your desired database user name (blank/default: $DATABASE_USERNAME)" NEW_DATABASE_USERNAME
	
	read -p "Enter your desired MongoDB Port (blank/default: $MONGODB_PORT)" NEW_MONGODB_PORT
	read -p "Enter your desired Redis Port (blank/default: $MONGODB_PORT)" NEW_REDIS_PORT
	read -p "Enter your desired MongoDB Password (blank/default: $MONGODB_PASSWORD)" NEW_MONGODB_PASSWORD
	read -p "Enter your desired Redis Password (blank/default: $REDIS_PASSWORD)" NEW_REDIS_PASSWORD

	read -p "Enter your cookie secret (blank/default: $COOKIESECRET)" COOKIESECRET
	read -p "Enter your tripcode secret (blank/default: $TRIPCODESECRET)" TRIPCODESECRET
	read -p "Enter your IP Hash secret (blank/default: $IPHASHSECRET)" IPHASHSECRET
	read -p "Enter your post password secret (blank/default: $POSTPASSWORDSECRET)" POSTPASSWORDSECRET
		
	HOST_IP=${NEW_HOST_IP:-$HOST_IP}
	HOST_PORT=${NEW_HOST_PORT:-$HOST_PORT}
	DATABASE_NAME=${NEW_DATABASE_NAME:-$DATABASE_NAME}
	DATABASE_USERNAME=${NEW_DATABASE_USERNAME:-$DATABASE_USERNAME}
	MONGODB_PORT=${NEW_MONGODB_PORT:-$MONGODB_PORT}
	REDIS_PORT=${NEW_REDIS_PORT:-$REDIS_PORT}
	MONGODB_PASSWORD=${NEW_MONGODB_PASSWORD:-$MONGODB_PASSWORD}
	REDIS_PASSWORD=${NEW_REDIS_PASSWORD:-$REDIS_PASSWORD}
	
	read -p "Is this correct?
	Host IP Address: $HOST_IP
	Host Backend Port Address: $HOST_PORT
	Database Name: $DATABASE_NAME
	Database Username: $DATABASE_USERNAME
	Redis Port: $REDIS_PORT
	MongoDB Port: $MONGODB_PORT
	MongoDB Password: $MONGODB_PASSWORD
	Redis Password: $REDIS_PASSWORD
	Cookie Secret: $COOKIESECRET
	Tripcode Secret: $TRIPCODESECRET
	IP Hash Secret: $IPHASHSECRET
	Post Password Secret: $POSTPASSWORDSECRET
	(y/n): " CORRECT
	[[ "$CORRECT" == "n" ]] && echo "Exiting..." && exit;
fi

read -p "Configure website template? (y/n): " CONFIG_SITE_CONFIG

if [ "$CONFIG_SITE_CONFIG" == "y" ]; then
editor $AVFOO_FOLDER/configs/template.js.example
fi

read -p "Use a default nginx configuration? (y/n): " CONFIG_NGINX_DEFAULT_CONFIG

if [ "$CONFIG_NGINX_CONFIG" == "y" ]; then
	JSCHAN_DIRECTORY=$AVFOO_FOLDER
	SITES_AVAILABLE_NAME=jschan
	ROBOTS_TXT_DISALLOW="n"
	GOOGLE_CAPTCHA="y"
	H_CAPTCHA="y"
	Y_CAPTCHA="y"
	GEOIP="y"
	SKIP_QUESTIONS="y"
fi

if [ "$CONFIG_NGINX_DEFAULT_CONFIG" != "y" ]; then

read -p "Configure nginx configuration now? (y/n): " CONFIG_NGINX_CONFIG

fi

if [ "$CONFIG_NGINX_CONFIG" == "y" ]; then
	JSCHAN_DIRECTORY=$AVFOO_FOLDER
	read -p "Enter your clearnet domain name e.g. example.com (blank=no clearnet domain): " CLEARNET_DOMAIN
	SITES_AVAILABLE_NAME=${CLEARNET_DOMAIN:-jschan} #not sure on a good default, used for sites-available config name
	read -p "Enter tor .onion address (blank=no .onion address): " ONION_DOMAIN
	read -p "Enter lokinet .loki address (blank=no .loki address): " LOKI_DOMAIN
	read -p "Would you like to add a www. subdomain? (y/n): " ADD_WWW_SUBDOMAIN
	
	if [ "$CLEARNET_DOMAIN" != "" ]; then
		read -p "Run certbot and automatically configure a certificate for https on clearnet? (y/n): " CERTBOT
		if [ "$CERTBOT" == "n" ]; then
			read -p "Generate a self-signed certificate instead? (y/n): " SELFSIGNED
		fi
		if [ "$SELFSIGNED" == "n" ]; then
			read -p "Warning: no https certificate chosen for clearnet. Continue without https? (y/n): " NOHTTPS
			[[ "$NOHTTPS" == "n" ]] && echo "Exiting..." && exit;
		fi
	fi
	
	read -p "Should robots.txt disallow compliant crawlers? (y/n): " ROBOTS_TXT_DISALLOW
	read -p "Allow google captcha in content-security policy? (y/n): " GOOGLE_CAPTCHA
	read -p "Allow Hcaptcha in content-security policy? (y/n): " H_CAPTCHA
	read -p "Allow Yandex SmartCaptcha in content-security policy? (y/n): " Y_CAPTCHA
	read -p "Download and setup geoip for post flags? (y/n): " GEOIP

	#looks good?
	read -p "Is this correct?
	jschan directory: $JSCHAN_DIRECTORY
	clearnet domain: $CLEARNET_DOMAIN
	.onion address: $ONION_DOMAIN
	.loki address: $LOKI_DOMAIN
	www subdomains: $ADD_WWW_SUBDOMAIN
	certbot https cert: $CERTBOT
	self-signed https cert: $SELFSIGNED
	no https cert: $NOHTTPS
	robots.txt disallow all: $ROBOTS_TXT_DISALLOW
	google captcha: $GOOGLE_CAPTCHA
	hcaptcha: $H_CAPTCHA
	yandex captcha: $Y_CAPTCHA
	geoip: $GEOIP
	(y/n): " CORRECT
	[[ "$CORRECT" == "n" ]] && echo "Exiting..." && exit;
	# Skip questions in the setup nginx script
	
	SKIP_QUESTIONS="y"
fi

read -p "Proceed with installation? (y/n): " PROCEED_INSTALLATION

if [ "$PROCEED_INSTALLATION" == "n" ]; then
	exit 1
fi

run_install_dependencies () {
	echo "Installing dependencies: git nano coreutils curl wget redis-server libgeoip-dev gnupg ffmpeg imagemagick graphicsmagick fontconfig fonts-dejavu certbot"
	sudo apt update -y 
	sudo apt install git nano curl wget coreutils redis-server libgeoip-dev gnupg ffmpeg imagemagick graphicsmagick fontconfig fonts-dejavu certbot -y
}

run_setup_secrets () {
	sudo echo "module.exports = {

	//mongodb connection string
	dbURL: 'mongodb://$DATABASE_USERNAME:$MONGODB_PASSWORD@$HOST_IP:$MONGODB_PORT/$DATABASE_NAME',

	//database name
	dbName: '$DATABASE_NAME',

	//redis connection info
	redis: {
		host: '$HOST_IP',
		port: '$REDIS_PORT',
		password: '$REDIS_PASSWORD'
	},

	//backend webserver port
	port: $HOST_PORT,

	//secrets/salts for various things
	cookieSecret: '$COOKIESECRET',
	tripcodeSecret: '$TRIPCODESECRET',
	ipHashSecret: '$IPHASHSECRET',
	postPasswordSecret: '$POSTPASSWORDSECRET',

	//keys for google recaptcha
	google: {
		siteKey: 'changeme',
		secretKey: 'changeme'
	},

	//keys for hcaptcha
	hcaptcha: {
		siteKey: '10000000-ffff-ffff-ffff-000000000001',
		secretKey: '0x0000000000000000000000000000000000000000'
	},

	//keys for yandex smartcaptcha
	yandex: {
		siteKey: 'changeme',
		secretKey: 'changeme'
	},

	//enable debug logging
	debugLogs: true,

};" > $AVFOO_FOLDER/configs/secrets.js 
	sudo editor $AVFOO_FOLDER/configs/secrets.js
	sudo chown -R www-data:www-data $AVFOO_FOLDER

}

run_install_mongodb () {
	cd /tmp
	echo "Installing MongoDB 8.0"
	# Curl the keyring
	curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | \
	gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg \
	--dearmor 
	
	# Enable apt repo
	echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.2.list 
	
	cd $AVFOO_FOLDER
	
	sudo apt-get update -y
	sudo apt-get install -y mongodb-org 
	sudo systemctl enable --now mongod

	sudo mkdir -p /var/lib/mongodb 
	sudo mkdir -p /var/log/mongodb
	sudo chown -R mongodb:mongodb /var/lib/mongodb 
	sudo chown -R mongodb:mongodb /var/log/mongodb
	sleep 5
	chown mongodb:mongodb /tmp/mongodb-$MONGODB_PORT.sock 
	service mongod restart 
	echo "Waiting until mongod is alive..."
	sleep 5

	# Create database
	mongosh admin --eval "db.getSiblingDB('$DATABASE_NAME').createUser({user: '$DATABASE_USERNAME', pwd: '$MONGODB_PASSWORD', roles: [{role:'readWrite', db:'$DATABASE_NAME'}]})"
	
	# Do config
	echo "storage:
	dbPath: /var/lib/mongodb
systemLog:
	destination: file
	logAppend: true
	path: /var/log/mongodb/mongod.log
net:
	port: $MONGODB_PORT
	bindIp: $HOST_IP
processManagement:
	timeZoneInfo: /usr/share/zoneinfo
security:
	authorization: \"enabled\"
" > /etc/mongod.conf 

	sudo systemctl restart mongod 

	#NOTE: to access to DB directly in future:
	#mongosh "mongodb://$DATABASE:$MONGODB_PASSWORD@$HOST_IP:$MONGODB_PORT/$DATABASE_NAME"

}

run_setup_redis () {
	sudo sed -i -e 's/supervised no/supervised systemd/' -e '$!b' -e '/# supervised auto/!b' -e 's/# supervised auto/supervised auto/' -e '$!s/$/\nsupervised systemd/' /etc/redis/redis.conf
	sudo systemctl enable --now redis-server 

	echo "requirepass $REDIS_PASSWORD" | sudo tee -a /etc/redis/redis.conf
	sudo systemctl restart redis-server
}


run_install_node () {
	curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
	sudo apt-get install -y nodejs
	# Confirm node installation
	node -v
}

run_install_nginx () {
	cd /tmp
	wget https://raw.githubusercontent.com/averi-foo/nginx-autoinstall/master/nginx-autoinstall.sh -O nginx-autoinstall.sh
	sudo chmod +x nginx-autoinstall.sh
	
	HEADLESS=y OPTION=1 NGINX_VER=STABLE SUBFILTER=y RTMP=y sudo ./nginx-autoinstall.sh
	echo "You can safely ignore that error about restarting nginx ^"
	rm nginx-autoinstall.sh
	sudo mkdir -p /etc/nginx/snippets
	cd $AVFOO_FOLDER
	
	# Setup nginx
	JSCHAN_DIRECTORY="$JSCHAN_DIRECTORY" \
	CLEARNET_DOMAIN="$CLEARNET_DOMAIN" \
	ONION_DOMAIN="$ONION_DOMAIN" \
	LOKI_DOMAIN="$LOKI_DOMAIN" \
	ADD_WWW_SUBDOMAIN="$ADD_WWW_SUBDOMAIN" \
	CERTBOT="$CERTBOT" \
	SELFSIGNED="$SELFSIGNED" \
	NOHTTPS="$NOHTTPS" \
	ROBOTS_TXT_DISALLOW="$ROBOTS_TXT_DISALLOW" \
	GOOGLE_CAPTCHA="$GOOGLE_CAPTCHA" \
	H_CAPTCHA="$H_CAPTCHA" \
	Y_CAPTCHA="$Y_CAPTCHA" \
	GEOIP="$GEOIP" \
	SKIP_QUESTIONS="$SKIP_QUESTIONS" \
	HOST_IP="$HOST_IP" \
	HOST_PORT="$HOST_PORT" \
	bash $AVFOO_FOLDER/configs/nginx/nginx.sh
}

run_setup_npm () {
	cd $AVFOO_FOLDER
	npm install 
	npm run-script setup 
	gulp reset
	pm2 startup
	echo "Run the command above and then run sudo ./install.sh --stage=run_setup_npm_2 to continue"
	exit
}

run_setup_npm_2 () {
	cd $AVFOO_FOLDER
	npm run-script start 
	gulp 
	pm2 save 
	./reload.sh 
	pm2 update 
}



echo "Installing..."

run_install_dependencies
run_setup_secrets
run_install_mongodb
run_setup_redis
run_install_node
run_install_nginx
run_setup_npm
run_setup_npm_2

