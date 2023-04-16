#!/bin/bash

##########################################
# Build the API's code into a Docker image
##########################################

#
# Ensure that we are in the root folder
#
cd "$(dirname "${BASH_SOURCE[0]}")"
cd ../..

#
# Support different docker repositories
#
if [ "$DOCKER_REPOSITORY" == "" ]; then
  DOCKER_IMAGE='finalnetcoreapi:1.0.0'
else
  DOCKER_IMAGE="$DOCKER_REPOSITORY/finalnodejsapi:1.0.0"
fi

#
# Build the Node.js API
#
npm install
npm run buildRelease
if [ $? -ne 0 ]; then
  echo '*** Node.js API build problem encountered'
  exit 1
fi

#
# Build the Docker container
#
docker build --no-cache -f deployment/kubernetes/Dockerfile -t "$DOCKER_IMAGE" .
if [ $? -ne 0 ]; then
  echo '*** API docker build problem encountered'
  exit 1
fi

#
# Push the API docker image
#
if [ "$DOCKER_REPOSITORY" == "" ]; then
  kind load docker-image "$DOCKER_IMAGE" --name oauth
else
  docker image push "$DOCKER_IMAGE"
fi
if [ $? -ne 0 ]; then
  echo '*** API docker push problem encountered'
  exit 1
fi
