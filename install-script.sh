# Install Syft and Grype
mkdir -p /home/ec2-user/.local/bin

curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /home/ec2-user/.local/bin
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /home/ec2-user/.local/bin

# Add binaries to PATH
echo 'export PATH=$HOME/.local/bin:$PATH' >> /home/ec2-user/.bashrc
source /home/ec2-user/.bashrc

# Download and process wad2-assign2 repo
curl -L -o main.zip https://github.com/DylBP/wad2-assign2/archive/refs/heads/main.zip
unzip main.zip
cd wad2-assign2-main
syft . -o cyclonedx-json > sbom.json
grype sbom.json -o table > output.grype
cd ..

# Download and run SBOM-FYP Flask API
curl -L -o app.zip https://github.com/DylBP/SBOM-FYP/archive/refs/heads/main.zip
unzip app.zip
cd SBOM-FYP-main/api
npm install
npm install -g pm2
pm2 start ExpressAPI.js --name sbom-api
pm2 startup

