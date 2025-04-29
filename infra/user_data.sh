#!/bin/bash

# Log output to userdata.log
exec > /var/log/user-data.log 2>&1
set -euxo pipefail

cd /home/ec2-user

# Download latest main branch, unzip, and change into directory
curl -L -o app.zip https://github.com/DylBP/SBOM-FYP/archive/refs/heads/main.zip
unzip -o app.zip
cd SBOM-FYP-main/api

# Output environment variables (from TF) into the .env file of the API
cat <<EOF > .env
AWS_REGION=eu-west-1
PORT=3000
S3_SBOM_BUCKET_NAME=${bucket_name}
DYNAMO_SBOM_TABLE=${sbom_table_name}
DYNAMO_PROJECTS_TABLE=${project_table_name}
COGNITO_CLIENT_ID=${cognito_client_id}
COGNITO_CLIENT_SECRET=${cognito_client_secret}
COGNITO_USER_POOL_ID=${cognito_user_pool_id}
EOF

# Make the temp dir and change owner (from sudo to ec2-user)
mkdir -p /home/ec2-user/SBOM-FYP-main/api/temp
chown ec2-user:ec2-user /home/ec2-user/SBOM-FYP-main/api/temp

# npm ci is used to install dependencies from package-lock.json
npm ci

# Configure pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user

# Update Grype DB
sudo -u ec2-user /home/ec2-user/.local/bin/grype db update

# Start the API and save
sudo -u ec2-user pm2 start /home/ec2-user/SBOM-FYP-main/api/ExpressAPI.js --name ExpressAPI
sudo -u ec2-user pm2 save
