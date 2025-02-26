const path = require('path');
const fs = require('fs');
const { extractMetadata } = require('../utils/metadataUtils');
const { uploadToS3 } = require('../services/s3Service');
const { storeMetadata } = require('../services/dynamoService');
const { scanSBOM, cleanupFile } = require('../services/grypeService');
const { S3_SBOM_BUCKET_NAME } = require('../config/env');

/**
 * Uploads an SBOM file, extracts metadata, and scans for vulnerabilities.
 */
async function processSBOM(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const filePath = path.join(__dirname, '../temp', req.file.filename);
  const fileContent = fs.readFileSync(filePath);
  const s3Key = `sboms/${req.file.filename}`;

  try {
    await uploadToS3(fileContent, S3_SBOM_BUCKET_NAME, s3Key);
    
    const sbomData = JSON.parse(fileContent);
    const metadata = extractMetadata(sbomData);
    await storeMetadata(req.file.filename, metadata, s3Key);
    
    const vulnReport = await scanSBOM(filePath);
    const vulnReportKey = `vuln-reports/${req.file.filename.replace('.json', '_vuln_report.json')}`;
    await uploadToS3(JSON.stringify(vulnReport), S3_SBOM_BUCKET_NAME, vulnReportKey);

    res.json({
      message: '✔️ SBOM uploaded, metadata stored, vulnerabilities scanned.',
      s3Location: s3Key,
      vulnReportLocation: vulnReportKey,
    });
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Failed to process SBOM', details: err.message });
  } finally {
    cleanupFile(filePath);
  }
}

module.exports = { processSBOM };
