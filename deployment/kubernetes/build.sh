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
# Manage differences between local and cloud deployment
#
if [ "$CLUSTER_TYPE" != 'local' ]; then
  
  if [ "$DOCKERHUB_ACCOUNT" == '' ]; then
    echo '*** The DOCKERHUB_ACCOUNT environment variable has not been configured'
    exit 1
  fi

  DOCKER_IMAGE_NAME="$DOCKERHUB_ACCOUNT/finalnodejsapi:v1"
else

  DOCKER_IMAGE_NAME='finalnodejsapi:v1'
fi

#
# Get the local computer platform
#
case "$(uname -s)" in

  Darwin)
    PLATFORM="MACOS"
 	;;

  MINGW64*)
    PLATFORM="WINDOWS"
	;;

  Linux)
    PLATFORM="LINUX"
	;;
esac

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
# Copy in the internal cluster root CA from the parent project, to be trusted within the container
#
cp ../certs/default.svc.cluster.local.ca.pem deployment/shared/trusted.ca.pem

#
# On Windows, fix problems with trailing newline characters in Docker scripts
#
if [ "$PLATFORM" == 'WINDOWS' ]; then
  sed -i 's/\r$//' deployment/shared/docker-init.sh
fi

#
# Build the Docker container
#
docker build --no-cache -f deployment/shared/Dockerfile --build-arg TRUSTED_CA_CERTS='deployment/shared/trusted.ca.pem' -t "$DOCKER_IMAGE_NAME" .
if [ $? -ne 0 ]; then
  echo '*** API docker build problem encountered'
  exit 1
fi

#
# Push the API docker image
#
if [ "$CLUSTER_TYPE" == 'local' ]; then
  kind load docker-image "$DOCKER_IMAGE_NAME" --name oauth
else
  docker image push "$DOCKER_IMAGE_NAME"
fi
if [ $? -ne 0 ]; then
  echo '*** API docker push problem encountered'
  exit 1
fi