const path = require('path');
const { extractZipToTempDir } = require('../utils/archiveUtils');
const { generateSBOM } = require('./syftService');
const { cleanupFile, cleanupDirectory } = require('./cleanupService');

async function generateFromArchive(zipFilePath) {
  const extractedDir = extractZipToTempDir(zipFilePath);
  const sbomPath = await generateSBOM('dir', extractedDir, 'cyclonedx-json');

  return {
    sbomPath,
    cleanup: () => {
      cleanupFile(zipFilePath);
      cleanupFile(sbomPath);
      cleanupDirectory(extractedDir);
    },
  };
}

async function generateFromDockerImage(imageName) {
  const sbomPath = await generateSBOM('docker', imageName, 'cyclonedx-json');

  return {
    sbomPath,
    cleanup: () => {
      cleanupFile(sbomPath);
    },
  };
}

module.exports = {
  generateFromArchive,
  generateFromDockerImage,
};
