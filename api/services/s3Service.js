const { S3Client, HeadBucketCommand, CreateBucketCommand, DeleteBucketCommand, ListObjectsV2Command, DeleteObjectsCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { s3 } = require('../config/awsConfig');

/**
 * Function to create the S3 bucket used to store SBOMS and vulnerability reports
 */
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

/**
 * Function to delete the SBOM bucket on server shutdown
 */
async function deleteSBOMBucket() {
  try {
    const listParams = { Bucket: 'sbom-files' };
    const listedObjects = await s3.send(new ListObjectsV2Command(listParams));

    if (listedObjects.Contents && listedObjects.Contents.length > 0) {
      const deleteParams = {
        Bucket: 'sbom-files',
        Delete: { Objects: listedObjects.Contents.map(({ Key }) => ({ Key })) },
      };
      await s3.send(new DeleteObjectsCommand(deleteParams));
      console.log('🗑️ All objects deleted from "sbom-files".');
    }

    await s3.send(new DeleteBucketCommand({ Bucket: 'sbom-files' }));
    console.log('💥 S3 bucket "sbom-files" deleted.');
  } catch (err) {
    console.error('❌ Error deleting bucket:', err);
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

module.exports = { uploadToS3, createSBOMBucket, deleteSBOMBucket };
