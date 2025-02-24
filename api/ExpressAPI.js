// ================================
// Dependencies & Configuration
// ================================
const path = require("path");
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { ListObjectsV2Command, DeleteObjectsCommand, DeleteBucketCommand, CreateBucketCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, CreateTableCommand, DeleteTableCommand } = require('@aws-sdk/client-dynamodb');
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
  // credentials: {
  //   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  // },
});

const s3 = new S3Client({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dbClient);

// ================================
// Infrastructure: S3 Bucket Setup
// ================================
async function createSBOMBucket() {
  const bucketName = 'sbom-files';

  try {
    // Check if bucket exists
    await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`⚠️ Bucket "${bucketName}" already exists.`);
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      // Bucket does not exist, create it
      const bucketParams = {
        Bucket: bucketName,
        CreateBucketConfiguration: {
          LocationConstraint: process.env.AWS_REGION,
        },
      };

      try {
        await s3.send(new CreateBucketCommand(bucketParams));
        console.log(`✔️ Bucket "${bucketName}" created successfully.`);
      } catch (createErr) {
        console.error(`❌ Error creating bucket:`, createErr);
      }
    } else {
      console.error(`❌ Error checking bucket existence:`, err);
    }
  }
}

createSBOMBucket();

// ================================
// Delete S3 Bucket on Shutdown
// ================================
async function deleteSBOMBucket() {
  try {
    // 1️⃣ List all objects in the bucket
    const listParams = { Bucket: 'sbom-files' };
    const listedObjects = await s3.send(new ListObjectsV2Command(listParams));

    // 2️⃣ Delete all objects if any exist
    if (listedObjects.Contents && listedObjects.Contents.length > 0) {
      const deleteParams = {
        Bucket: 'sbom-files',
        Delete: { Objects: listedObjects.Contents.map(({ Key }) => ({ Key })) },
      };
      await s3.send(new DeleteObjectsCommand(deleteParams));
      console.log('🗑️ All objects deleted from "sbom-files".');
    }

    // 3️⃣ Delete the bucket
    await s3.send(new DeleteBucketCommand({ Bucket: 'sbom-files' }));
    console.log('💥 S3 bucket "sbom-files" deleted.');
  } catch (err) {
    console.error('❌ Error deleting bucket:', err);
  }
}

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
// Delete DynamoDB Table on Shutdown
// ================================
async function deleteSBOMTable() {
  try {
    await dbClient.send(new DeleteTableCommand({ TableName: 'sbom-table' }));
    console.log('💥 DynamoDB table "sbom-table" deleted.');
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      console.log('⚠️ DynamoDB table "sbom-table" does not exist.');
    } else {
      console.error('❌ Error deleting DynamoDB table:', err);
    }
  }
}

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

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = () => {
  console.log('\n🛑 Shutting down server...');

  Promise.all([deleteSBOMBucket(), deleteSBOMTable()])
    .then(() => {
      console.log('✅ Cleanup complete. Exiting.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Error during cleanup:', err);
      process.exit(1);
    });
};

process.on('SIGINT', gracefulShutdown);   // Ctrl+C
process.on('SIGTERM', gracefulShutdown);  // Termination Signal


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
    await uploadToS3(fileContent, process.env.S3_SBOM_BUCKET_NAME, s3Key);

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
      await uploadToS3(JSON.stringify(vulnReport), process.env.S3_SBOM_BUCKET_NAME, vulnReportKey);

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
