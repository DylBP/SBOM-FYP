curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sudo sh -s -- -b /usr/local/bin
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sudo sh -s -- -b /usr/local/bin
curl -L -o main.zip https://github.com/DylBP/wad2-assign2/archive/refs/heads/main.zip
unzip main.zip
syft wad2-assign2-main/ -o cyclonedx-json > sbom.json
cat sbom.json | grype > output.grype