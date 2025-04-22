const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { s3 } = require('../config/awsConfig');

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
  console.log(`✔️ File uploaded to S3: ${s3Key}`);
}

/**
 * Deletes a file from S3.
 */
async function deleteFileFromS3(s3Key) {
  const bucketName = S3_SBOM_BUCKET_NAME;

  const params = {
    Bucket: bucketName,
    Key: s3Key,
  };
  
  try {
    await s3.send(new DeleteObjectCommand(params));
    console.log(`🗑️ File deleted from S3: ${s3Key}`);
  } catch (error) {
    console.error(`❌ Error deleting file from S3 (${s3Key}):`, error);
    throw error;
  }
}

/**
 * Convert S3 ReadableStream into a string
 */
function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

/**
 * Downloads and parses a JSON file from S3 given an s3://bucket/key URI
 */
async function downloadAndParseJSONFromS3(key, bucket) {
  if (!bucket) throw new Error("Bucket name must be provided");

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await s3.send(command);
  const body = await streamToString(response.Body);
  return JSON.parse(body);
}

module.exports = { 
  uploadToS3, 
  createSBOMBucket, 
  deleteFileFromS3 ,
  downloadAndParseJSONFromS3
};
