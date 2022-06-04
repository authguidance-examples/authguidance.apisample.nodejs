#!/bin/bash

##############################################################
# A script to test Docker deployment on a development computer
##############################################################

cd "$(dirname "${BASH_SOURCE[0]}")"
cd ..

#
# Download certificates if required
#
./downloadcerts.sh
if [ $? -ne 0 ]; then
  exit
fi

#
# Install dependencies
#
if [ ! -d 'node_modules' ]; then
  
  rm -rf node_modules
  npm install
  if [ $? -ne 0 ]; then
    echo "Problem encountered installing dependencies"
    exit
  fi
fi

#
# Build to the dist folder
#
npm run buildRelease
if [ $? -ne 0 ]; then
  echo 'Problem encountered building the Node.js code'
  exit
fi

#
# Prepare root CA certificates that the Docker container will trust
#
cp certs/authsamples-dev.ca.pem docker/trusted.ca.pem

#
# On Windows, fix problems with trailing newline characters in Docker scripts
#
sed -i 's/\r$//' docker/docker-init.sh

#
# Build the docker image
#
docker build -f docker/Dockerfile --build-arg TRUSTED_CA_CERTS='docker/trusted.ca.pem' -t finalapi:v1 .
if [ $? -ne 0 ]; then
  echo 'Problem encountered building the OAuth Agent docker image'
  exit
fi

#
# Run the docker deployment
#
docker compose --file docker/docker-compose.yml --project-name finalapi up --force-recreate --detach
if [ $? -ne 0 ]; then
  echo "Problem encountered running Docker image"
  exit 1
fi

#
# Wait for it to become available
#
echo 'Waiting for API to become available ...'
BASE_URL='https://api.authsamples-dev.com:446'
while [ "$(curl -k -s -o /dev/null -w ''%{http_code}'' "$BASE_URL/api/companies")" != '401' ]; do
  sleep 2
done
