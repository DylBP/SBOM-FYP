// ================================
// Dependencies & Configuration
// ================================
const path = require("path");
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { exec } = require('child_process');

const app = express();
const port = process.env.PORT || 3000;
const FILES_DIR = path.join(__dirname, "temp");

// Ensure temp directory exists
if (!fs.existsSync(FILES_DIR)) {
  fs.mkdirSync(FILES_DIR);
}

// ================================
// AWS Clients Setup
// ================================
const dbClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const s3 = new S3Client({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dbClient);

// ================================
// Infrastructure: DynamoDB Setup
// ================================
async function createSBOMTable() {
  const params = {
    TableName: 'sbom-table',
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }], // Partition Key
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  };

  try {
    const data = await dbClient.send(new CreateTableCommand(params));
    console.log('✔️ Table Created Successfully:', data.TableDescription.TableName);
  } catch (err) {
    if (err.name === 'ResourceInUseException') {
      console.log('⚠️ Table already exists.');
    } else {
      console.error('❌ Error creating table:', err);
    }
  }
}

createSBOMTable();

// ================================
// Multer Middleware (File Upload)
// ================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, FILES_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const upload = multer({ storage });

// ================================
// Helper Functions
// ================================

/**
 * Uploads a file to S3.
 */
async function uploadToS3(fileContent, bucketName, s3Key) {
  const params = {
    Bucket: bucketName,
    Key: s3Key,
    Body: fileContent,
    ContentType: 'application/json',
  };
  await s3.send(new PutObjectCommand(params));
  console.log(`✔️ SBOM uploaded to S3 at: ${s3Key}`);
}

/**
 * Extracts metadata from SBOM content.
 */
function extractMetadata(sbomData) {
  return {
    spdxId: sbomData.SPDXID || 'Unknown',
    name: sbomData.name || 'Unnamed SBOM',
    creationInfo: sbomData.creationInfo?.created || new Date().toISOString(),
  };
}

/**
 * Stores SBOM metadata in DynamoDB.
 */
async function storeMetadataInDynamoDB(filename, metadata, s3Key) {
  const dbParams = {
    TableName: 'sbom-table',
    Item: {
      id: filename,
      name: metadata.name,
      spdxId: metadata.spdxId,
      createdAt: metadata.creationInfo,
      s3Location: s3Key,
    },
  };
  await docClient.send(new PutCommand(dbParams));
  console.log('✔️ Metadata stored in DynamoDB');
}

// ================================
// Routes
// ================================

// Root Route - Health Check
app.get('/', (req, res) => {
  res.send('✅ DynamoDB & S3 Connected!');
});

app.post('/uploadSBOM', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const filePath = path.join(FILES_DIR, req.file.filename);
  const fileContent = fs.readFileSync(filePath);
  const s3Key = `sboms/${req.file.filename}`;

  try {
    // Upload SBOM to S3
    await uploadToS3(fileContent, s3Key, process.env.S3_SBOM_BUCKET_NAME);

    // Extract Metadata
    const sbomData = JSON.parse(fileContent);
    const metadata = extractMetadata(sbomData);

    // Store Metadata in DynamoDB
    await storeMetadataInDynamoDB(req.file.filename, metadata, s3Key);

    // Run Grype to scan for vulnerabilities
    const grypeCommand = `grype ${filePath} -o json`;
    
    // Execute the Grype command and capture the output
    exec(grypeCommand, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running Grype: ${stderr}`);
        return res.status(500).json({ error: 'Failed to scan SBOM for vulnerabilities', details: stderr });
      }

      // Parse Grype JSON output
      const vulnReport = JSON.parse(stdout);

      // Create a report key for the new file in the 'vuln-reports' bucket
      const vulnReportKey = `vuln-reports/${req.file.filename.replace('.json', '_vuln_report.json')}`;

      // Upload the vulnerability report to S3
      await uploadToS3(JSON.stringify(vulnReport), vulnReportKey, process.env.S3_VULN_REPORT_NAME);

      // Clean up local temp file
      fs.unlinkSync(filePath);

      res.json({
        message: '✔️ SBOM uploaded to S3, metadata stored in DynamoDB, and vulnerabilities uploaded to vuln-reports',
        s3Location: s3Key,
        vulnReportLocation: vulnReportKey,
      });
    });
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Failed to upload SBOM', details: err.message });
  }
});

// ================================
// Start Server
// ================================
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
