const { execFile } = require('child_process');
const path = require('path');

/**
 * Runs Grype to scan an SBOM file for vulnerabilities.
 * @param {string} filePath - Full path to the SBOM file
 */
async function scanSBOM(filePath) {
  return new Promise((resolve, reject) => {
    const grypePath = process.env.GRYPE_PATH || '/home/ec2-user/.local/bin/grype';

    console.log(`📦 Running Grype on SBOM file: ${filePath}`);
    console.log(`🧭 Using Grype binary: ${grypePath}`);

    execFile(grypePath, [`sbom:${filePath}`, '-o', 'json'], { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Grype exited with error (code ${error.code}): ${error.message}`);
        if (stderr) console.error(`❌ STDERR: ${stderr}`);
        return reject(new Error(`Failed to scan SBOM: ${stderr || error.message}`));
      }

      if (stderr) {
        console.warn(`⚠️ Grype STDERR: ${stderr}`);
      }

      try {
        const parsed = JSON.parse(stdout);
        console.log(`✅ Grype scan completed. Vulnerabilities found: ${parsed.matches?.length ?? 'unknown'}`);
        resolve(parsed);
      } catch (parseError) {
        console.error("❌ Failed to parse Grype output:", parseError.message);
        reject(new Error(`Error parsing Grype output: ${parseError.message}`));
      }
    });
  });
}

module.exports = { scanSBOM };
