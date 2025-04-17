const { HeadBucketCommand, CreateBucketCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3 } = require('../config/awsConfig');

/**
 * Function to create the S3 bucket used to store SBOMs and vulnerability reports
 */
async function createSBOMBucket() {
  const bucketName = process.env.S3_SBOM_BUCKET_NAME;

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

module.exports = { 
  uploadToS3, 
  createSBOMBucket, 
  deleteFileFromS3 
};
