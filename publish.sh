#!/bin/bash

cd megaphone-validator

echo "Removing old /node_modules"
rm -rf node_modules

echo "Removing old lambda.zip"
rm ../lambda.zip

echo "NPM install"
npm install

echo "Creating new lambda.zip"
zip -X -r ../lambda.zip .
echo "TADA!! Created new lambda.zip"

cd ..

echo "Uploading lambda to AWS..."
aws lambda update-function-code --function-name megaphoneValidator --zip-file fileb://lambda.zip
