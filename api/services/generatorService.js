const fs = require('fs');
const { extractZipToTempDir } = require('../utils/archiveUtils');
const { generateSBOM } = require('./syftService');
const { cleanupFile, cleanupDirectory } = require('./cleanupService');

async function generateFromArchive(zipFilePath) {
  const extractedDir = extractZipToTempDir(zipFilePath);
  console.log('📁 Extracted directory:', extractedDir);
  console.log('📄 Files inside:', fs.readdirSync(extractedDir));

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

async function generateFromOCIArchive(tarPath) {
  const sbomPath = await generateSBOM('oci-archive', tarPath, 'cyclonedx-json');
  return {
    sbomPath,
    cleanup: () => {
      cleanupFile(tarPath);
      cleanupFile(sbomPath);
    },
  }
}

async function generateFromRegistryImage(imageName) {
  const sbomPath = await generateSBOM('docker', imageName, 'cyclonedx-json');
  return {
    sbomPath,
    cleanup: () => {
      cleanupFile(sbomPath);
    },
  }
}

module.exports = {
  generateFromArchive,
  generateFromDockerImage,
  generateFromOCIArchive,
  generateFromRegistryImage
};
