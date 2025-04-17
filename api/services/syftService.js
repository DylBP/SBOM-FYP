const { execFile } = require('child_process');
const fs = require('fs');

/**
 * Generates an SBOM using Syft.
 */
async function generateSBOM(inputType, inputPath, outputFormat = 'cyclonedx-json') {
  const syftArgs = buildSyftArgs(inputType, inputPath, outputFormat);

  return new Promise((resolve, reject) => {
    execFile('syft', syftArgs, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Syft Error: ${stderr}`);
        return reject(new Error(`Failed to generate SBOM: ${stderr}`));
      }

      try {
        const sbom = JSON.parse(stdout);
        resolve(sbom);
      } catch (parseError) {
        reject(new Error(`Error parsing Syft output: ${parseError.message}`));
      }
    });
  });
}

/**
 * Constructs the Syft command arguments.
 */
function buildSyftArgs(inputType, inputPath, outputFormat) {
  let source;
  switch (inputType) {
    case 'file':
      source = `file:${inputPath}`;
      break;
    case 'dir':
      source = `dir:${inputPath}`;
      break;
    case 'docker':
      source = `docker:${inputPath}`;
      break;
    case 'oci-archive':
      source = `oci-archive:${inputPath}`;
      break;
    case 'sbom':
      source = `sbom:${inputPath}`;
      break;
    default:
      throw new Error(`Unsupported input type: ${inputType}`);
  }

  return [source, '-o', outputFormat];
}

/**
 * Deletes a temporary file.
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

module.exports = {
  generateSBOM,
  cleanupFile,
};
