# Install Syft and Grype
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sudo sh -s -- -b /usr/local/bin
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sudo sh -s -- -b /usr/local/bin

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
cd SBOM-FYP-main
pip install -r requirements.txt
python3 flask-api.py
