#!/bin/bash

# Install Syft and Grype
mkdir -p /home/ec2-user/.local/bin

# Syft
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /home/ec2-user/.local/bin

# Grype
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /home/ec2-user/.local/bin

# Add Syft/Grype binaries to PATH
echo 'export PATH=$HOME/.local/bin:$PATH' >> /home/ec2-user/.bashrc
source /home/ec2-user/.bashrc

# ----- LEFT COMMENTED TO REMEMBER PROCESS ----- #
# Download and process wad2-assign2 repo
# curl -L -o main.zip https://github.com/DylBP/wad2-assign2/archive/refs/heads/main.zip
# unzip main.zip
# cd wad2-assign2-main
# syft . -o cyclonedx-json > sbom.json
# grype sbom.json -o table > output.grype
# cd ..

# Configure new temp directory so that we can install Grype DB
mkdir $HOME/tmp
export TMPDIR=$HOME/tmp
grype db update

# Download FPY api
curl -L -o app.zip https://github.com/DylBP/SBOM-FYP/archive/refs/heads/main.zip
unzip app.zip
cd SBOM-FYP-main/api

# Install Docker (only to pull and scan container images from dockerhub - allows user to specify remote image instead of local OCI)
yum install -y docker

# Start Docker service
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group
usermod -aG docker ec2-user

# Restart the shell to apply group changes
echo "newgrp docker" >> /home/ec2-user/.bashrc 

# Install API dependencies
npm install

# Start API using pm2
pm2 start ExpressAPI.js --name ExpressAPI

