const path = require('path');
const fs = require('fs');
const { extractMetadata, extractVulnMetadata, normalizeSeverityCounts } = require('../utils/metadataUtils');
const { uploadToS3, deleteFileFromS3, downloadAndParseJSONFromS3 } = require('../services/s3Service');
const { storeMetadata, getUserSBOMs, getSbomRecord, deleteSbomRecord, getProject } = require('../services/dynamoService');
const { generateSBOM } = require('../services/syftService');
const { scanSBOM } = require('../services/grypeService');
const { cleanupFile, cleanupDirectory } = require('../services/cleanupService');
const { extractZipToTempDir } = require('../utils/archiveUtils');

/**
 * Uploads an SBOM file, extracts metadata, scans for vulnerabilities,
 * and (optionally) associates the SBOM with a Project.
 */
async function processSBOM(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // ──────────────────────────────────────
  // Optional project linkage
  // ──────────────────────────────────────
  const { projectId } = req.body;               // may be undefined
  if (projectId) {
    const project = await getProject(req.user.sub, projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
  }

  const filePath = path.join(__dirname, '../temp', req.file.filename);
  const fileContent = fs.readFileSync(filePath);
  const s3Key = `sboms/${req.file.filename}`;

  try {
    // Upload SBOM file to S3
    await uploadToS3(fileContent, process.env.S3_SBOM_BUCKET_NAME, s3Key);

    // Extract SBOM metadata
    const sbomData  = JSON.parse(fileContent);
    const metadata  = extractMetadata(sbomData);

    // Scan for vulnerabilities with Grype
    const vulnReport    = await scanSBOM(filePath);
    const vulnReportKey = `vuln-reports/${req.file.filename.replace('.json', '_vuln_report.json')}`;
    await uploadToS3(JSON.stringify(vulnReport), process.env.S3_SBOM_BUCKET_NAME, vulnReportKey);

    // Prepare vulnerability summary
    const vulnMeta              = extractVulnMetadata(vulnReport, vulnReportKey);
    vulnMeta.severityCounts     = normalizeSeverityCounts(vulnMeta.severityCounts);
    const severityOrder         = ['critical', 'high', 'medium', 'low', 'unknown'];
    const highestSeverity       = severityOrder.find(s => vulnMeta.severityCounts[s] > 0) || 'unknown';

    // 5️⃣ Persist metadata in DynamoDB
    await storeMetadata(
      req.file.filename,        // PK / id
      { ...metadata },          // SBOM metadata
      s3Key,                    // SBOM S3 key
      req.user.sub,             // userId (owner)
      projectId ?? null,        // NEW: nullable projectId foreign‑key
      { ...vulnMeta, highestSeverity }
    );

    // 6️⃣ Response
    res.status(200).json({
      message: '✔️ SBOM processed successfully',
      projectId: projectId ?? null,
      sbomMetadata: {
        name:        metadata.name,
        spdxId:      metadata.spdxId,
        createdAt:   metadata.creationInfo,
        s3Location:  s3Key,
        supplier:    metadata.supplier,
        license:     metadata.license,
      },
      vulnerabilityReport: {
        s3Location:           vulnReportKey,
        totalVulnerabilities: vulnMeta.totalVulnerabilities,
        severityCounts:       vulnMeta.severityCounts,
        highestSeverity,
      },
    });
  } catch (err) {
    console.error('❌ SBOM processing error:', err);
    res.status(500).json({
      error:   'Failed to process SBOM',
      details: err.message,
      stack:   process.env.NODE_ENV === 'development' ? err.stack : undefined,
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

async function getParsedSbomWithVulns(req, res) {
  const { id } = req.params;
  const userId = req.user.sub;

  try {
    // Use dynamoService to fetch and validate the SBOM record
    const sbom = await getSbomRecord(id, userId);

    if (!sbom) {
      return res.status(404).json({ message: "SBOM not found or access denied." });
    }

    // Download and parse the SBOM JSON from S3
    const sbomJson = await downloadAndParseJSONFromS3(sbom.s3Location, process.env.S3_SBOM_BUCKET_NAME);

    // Optionally download the Grype report
    let vulnJson = null;
    if (sbom.vulnReport?.s3Location) {
      try {
        vulnJson = await downloadAndParseJSONFromS3(sbom.vulnReport.s3Location, process.env.S3_SBOM_BUCKET_NAME);
      } catch (err) {
        console.warn("⚠️ Failed to load vuln report:", err.message);
      }
    }

    return res.json({ sbom: sbomJson, vulnReport: vulnJson });
  } catch (err) {
    console.error("❌ Failed to retrieve or parse SBOM:", err);
    if (err.message === "Unauthorized") {
      return res.status(403).json({ message: "Access denied." });
    }
    return res.status(500).json({ message: "Internal server error." });
  }
}

/**
 * ----- Generators -----
 */

/**
 * Generates an SBOM from a zipped project directory.
 */
async function generateSBOMFromArtifact(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const zipFilePath = path.join(__dirname, '../temp', req.file.filename);

  let extractedDir;
  let sbomPath;

  try {
    const extractedDir = extractZipToTempDir(zipFilePath);
    const sbomPath = await generateSBOM('dir', extractedDir, 'cyclonedx-json');

    res.download(sbomPath, 'sbom.json', () => {
      cleanupFile(sbomPath);
      cleanupDirectory(zipFilePath);
      if (extractedDir) cleanupDirectory(extractedDir);
    });

  } catch (err) {
    console.error('❌ Failed to generate SBOM from archive:', err.message);
    res.status(500).json({
      error: 'Failed to generate SBOM from archive',
      details: err.message,
    });
  }

  cleanupFile(zipFilePath);
  if (sbomPath) cleanupFile(sbomPath);
  if (extractedDir) cleanupDirectory(extractedDir);
}

module.exports = { processSBOM, getMySBOMs, deleteMySBOM, getSBOMById, generateSBOMFromArtifact, getParsedSbomWithVulns };
