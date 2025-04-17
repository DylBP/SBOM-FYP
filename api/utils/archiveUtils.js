const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');

/**
 * Extracts a ZIP file to a given directory.
 */
function extractZipToTempDir(zipFilePath) {
  const extractedDir = path.join(__dirname, '../temp', `${Date.now()}_extracted`);
  const zip = new AdmZip(zipFilePath);
  zip.extractAllTo(extractedDir, true);
  return extractedDir;
}

module.exports = {
  extractZipToTempDir,
};
