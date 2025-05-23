const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Generates an SBOM file using Syft and returns the output file path.
 */
async function generateSBOM(inputType, inputPath, outputFormat = 'cyclonedx-json') {
  const syftPath = '/home/ec2-user/.local/bin/syft';
  const outputFileName = `sbom_${Date.now()}_${crypto.randomUUID()}.json`;
  const outputFilePath = path.join(__dirname, '../temp', outputFileName);

  const syftArgs = buildSyftArgs(inputType, inputPath, outputFormat, outputFilePath);

  return new Promise((resolve, reject) => {
    console.log('📦 Running Syft command:', syftArgs.join(' '));
    execFile(syftPath, syftArgs, { timeout: 100000, env: { ...process.env, SYFT_LOG: 'error' } }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Syft Error: ${stderr}`);
        console.error(`❌ STDOUT: ${stdout}`);
        console.error(`❌ Error details: ${error.message}`);
        return reject(new Error(`Failed to generate SBOM: ${stderr || error.message}`));
      }

      if (!fs.existsSync(outputFilePath)) {
        return reject(new Error(`SBOM file not created at: ${outputFilePath}`));
      }

      resolve(outputFilePath);
    });
  });
}

/**
 * Constructs the Syft command arguments with file output.
 */
function buildSyftArgs(inputType, inputPath, outputFormat, outputFilePath) {
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

  return [source, '--output', `${outputFormat}=${outputFilePath}`];
}

module.exports = {
  generateSBOM,
};
