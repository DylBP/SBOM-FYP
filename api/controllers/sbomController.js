const path = require('path');
const fs = require('fs');
const { extractMetadata, extractVulnMetadata, normalizeSeverityCounts } = require('../utils/metadataUtils');
const { uploadToS3, deleteFileFromS3 } = require('../services/s3Service');
const { storeMetadata, getUserSBOMs, getSbomRecord, deleteSbomRecord } = require('../services/dynamoService');
const { generateSBOM } = require('../services/syftService');
const { scanSBOM } = require('../services/grypeService');
const { cleanupFile } = require('../services/cleanupService');
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
    
    vulnMetadata.severityCounts = normalizeSeverityCounts(vulnMetadata.severityCounts);

    // Define severity ranking order
    const severityOrder = ['critical', 'high', 'medium', 'low', 'unknown'];

    // Find the highest severity present in the report
    const highestSeverity = severityOrder.find(severity => vulnMetadata.severityCounts[severity] > 0) || 'unknown';

    // Store extended metadata in DynamoDB
    await storeMetadata(
      req.file.filename,
      {
        ...metadata,
        s3Location: s3Key,
        userId: req.user.sub, // Add userId inside the metadata object
      },
      s3Key,                  // s3Key as its own argument
      req.user.sub,            // userId as its own argument
      {
        ...vulnMetadata,
        highestSeverity,       // vulnMetadata as its own argument
      }
    );

    res.status(200).json({
      message: '✔️ SBOM processing completed successfully.',
      sbomMetadata: {
        name: metadata.name,
        spdxId: metadata.spdxId,
        createdAt: metadata.creationInfo,
        s3Location: s3Key,
        supplier: metadata.supplier, // Including supplier info if available
        license: metadata.license, // Including license info
      },
      vulnerabilityReport: {
        s3Location: vulnReportKey,
        totalVulnerabilities: vulnMetadata.totalVulnerabilities,
        severityCounts: vulnMetadata.severityCounts,
        highestSeverity, // The most severe vulnerability level
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

async function getSBOMById(req, res) {
  const { sbomId } = req.params;
  const userId = req.user.sub;

  try {
    const sbomRecord = await getSbomRecord(sbomId, userId);

    if (!sbomRecord) {
      return res.status(404).json({ message: 'SBOM record not found' });
    }
    
    if (sbomRecord.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized to view this SBOM' });
    }

    res.status(200).json(sbomRecord);

  } catch (error) {
    console.error('❌ Error fetching SBOM:', error);
    res.status(500).json({ message: 'Failed to retrieve SBOM', error: error.message });
  }
}

async function getMySBOMs(req, res) {
  try {
    const userId = req.user.sub;
    const sboms = await getUserSBOMs(userId);
    res.status(200).json(sboms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to retrieve user's SBOMs", error: error.message });
  }
}

async function deleteMySBOM(req, res) {
  const { sbomId } = req.params;
  const userId = req.user.sub;

  try {
    const sbomRecord = await getSbomRecord(sbomId, userId);

    if (!sbomRecord) {
      return res.status(404).json({ message: 'SBOM record not found' });
    }

    if (sbomRecord.s3Location) {
      await deleteFileFromS3(sbomRecord.s3Location);
    }

    if (sbomRecord.vulnReport?.s3Location) {
      await deleteFileFromS3(sbomRecord.vulnReport.s3Location);
    }

    await deleteSbomRecord(sbomId, userId);

    res.status(200).json({ message: '✔️ SBOM and associated files deleted successfully.' });

  } catch (error) {
    console.error('❌ Error deleting SBOM:', error);

    if (error.name === 'ConditionalCheckFailedException' || error.message === 'Unauthorized') {
      return res.status(403).json({ message: 'Unauthorized to delete this SBOM record' });
    }

    res.status(500).json({ message: 'Failed to delete SBOM', error: error.message });
  }
}

/**
 * ----- Generators -----
 */
async function generateSBOMFromArtifact(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const filePath = path.join(__dirname, '../temp', req.file.filename);

  try {
    const sbom = await generateSBOM('file', filePath, 'cyclonedx-json');
    res.status(200).json(sbom);
  } catch (error) {
    console.error('❌ Error generating SBOM:', error);
    res.status(500).json({ message: 'Failed to generate SBOM', error: error.message });
  } finally {
    cleanupFile(filePath)
  }
}

module.exports = { processSBOM, getMySBOMs, deleteMySBOM, getSBOMById, generateSBOMFromArtifact };
