const path = require('path');
const fs = require('fs');
const { extractMetadata, extractVulnMetadata } = require('../utils/metadataUtils');
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
    // Upload SBOM to S3
    await uploadToS3(fileContent, S3_SBOM_BUCKET_NAME, s3Key);

    // Extract SBOM metadata
    const sbomData = JSON.parse(fileContent);
    const metadata = extractMetadata(sbomData);

    // Scan SBOM for vulnerabilities
    const vulnReport = await scanSBOM(filePath);
    const vulnReportKey = `vuln-reports/${req.file.filename.replace('.json', '_vuln_report.json')}`;

    // Upload vulnerability report to S3
    await uploadToS3(JSON.stringify(vulnReport), S3_SBOM_BUCKET_NAME, vulnReportKey);

    // Extract vulnerability metadata
    const vulnMetadata = extractVulnMetadata(vulnReport, vulnReportKey);

    // Store extended metadata in DynamoDB
    await storeMetadata(req.file.filename, {
      ...metadata,
      s3Location: s3Key,
      vulnerabilityReport: {
        ...vulnMetadata,
      },
    });

    res.status(200).json({
      message: '✔️ SBOM processing completed successfully.',
      sbomMetadata: {
        name: metadata.name,
        spdxId: metadata.spdxId,
        createdAt: metadata.creationInfo,
        s3Location: s3Key,
        supplier: metadata.supplier,
        license: metadata.license,
      },
      vulnerabilityReport: {
        s3Location: vulnReportKey,
        totalVulnerabilities: vulnMetadata.totalVulnerabilities,
        severityCounts: vulnMetadata.severityCounts,
        highestSeverity: Object.keys(vulnMetadata.severityCounts).sort((a, b) => b - a)[0], // Determines the most severe vulnerability
      },
    });
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({
      error: 'Failed to process SBOM',
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  } finally {
    cleanupFile(filePath);
  }
}

module.exports = { processSBOM };
