
#!/bin/bash

################
# Deploy the API
################

#
# Ensure that we are in the folder containing this script
#
cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Give configuration files the correct name
#
cp ../environments/kubernetes-local.config.json api.config.json

#
# Check that we have the expected environment variable
#
if [ "$API_DOMAIN_NAME" == '' ]; then
  echo '*** The API_DOMAIN_NAME environment variable must be set before running this script'
  exit 1
fi
if [ "$API_DOCKER_IMAGE" == '' ]; then
  echo '*** The API_DOCKER_IMAGE environment variable must be set before running this script'
  exit 1
fi

#
# Create a configmap for the API's JSON configuration file
#
kubectl -n applications delete configmap api-config 2>/dev/null
kubectl -n applications create configmap api-config --from-file=api.config.json
if [ $? -ne 0 ]; then
  echo '*** Problem encountered creating the API configmap'
  exit 1
fi

#
# Create a secret for the private key password of the certificate file cert-manager will create
#
kubectl -n applications delete secret finalapi-pkcs12-password 2>/dev/null
kubectl -n applications create secret generic finalapi-pkcs12-password --from-literal=password='Password1'
if [ $? -ne 0 ]; then
  echo '*** Problem encountered creating the API certificate secret'
  exit 1
fi

#
# Produce the final YAML using the envsubst tool
#
envsubst < '../shared/api.yaml.template' > '../shared/api.yaml'
if [ $? -ne 0 ]; then
  echo '*** Problem encountered running envsubst to produce the final Kubernetes api.yaml file'
  exit 1
fi
exit

#
# Trigger deployment of the API to the Kubernetes cluster
#
kubectl -n applications delete -f ../shared/api.yaml 2>/dev/null
kubectl -n applications apply  -f ../shared/api.yaml
if [ $? -ne 0 ]; then
  echo '*** API Kubernetes deployment problem encountered'
  exit 1
fi