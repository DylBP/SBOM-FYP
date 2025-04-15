const { execFile } = require('child_process');
const fs = require('fs');

/**
 * Runs Grype to scan an SBOM file for vulnerabilities.
 */
async function scanSBOM(filePath) {
  return new Promise((resolve, reject) => {
    execFile('grype', [filePath, '-o', 'json'], { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Grype Error: ${stderr}`);
        return reject(new Error(`Failed to scan SBOM: ${stderr}`));
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (parseError) {
        reject(new Error(`Error parsing Grype output: ${parseError.message}`));
      }
    });
  });
}

/**
 * Deletes a file after processing.
 */
function cleanupFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted file: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error deleting file: ${error.message}`);
  }
}

module.exports = { scanSBOM, cleanupFile };
