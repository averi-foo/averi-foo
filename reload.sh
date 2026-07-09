#!/bin/bash

# Default environment to development
env="development"

# Check for the -p flag to set the environment to production
while getopts "p" opt; do
    case $opt in
        p)
            env="production"
            ;;
        *)
            echo "Usage: $0 [-p]"
            exit 1
            ;;
    esac
done

# Stop averi.foo server and flush logs
pm2 stop all
pm2 flush

# In prod
if [ "$env" == "production" ]; then
    # Pull new main branch
    git pull || { echo "Git pull failed"; exit 1; }
    #npm install || { echo "NPM install failed"; exit 1; }
fi

gulp migrate && gulp || { echo "Gulp tasks failed"; exit 1; }
# Start averi.foo server
pm2 restart ecosystem.config.js --env $env

echo "Server successfully reloaded in $env environment."

if [ "$env" == "development" ]; then
    pm2 logs
fi
