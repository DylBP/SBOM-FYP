const { 
    ListObjectsV2Command, 
    DeleteObjectsCommand, 
    DeleteBucketCommand 
  } = require('@aws-sdk/client-s3');
  const { DeleteTableCommand } = require('@aws-sdk/client-dynamodb');
  const { DeleteUserPoolCommand, DeleteUserPoolClientCommand } = require('@aws-sdk/client-cognito-identity-provider');
  const { s3, dbClient, cognitoClient } = require('../config/awsConfig');
  const fs = require('fs');
  
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
  // Delete DynamoDB Table on Shutdown
  // ================================
  async function deleteTables() {
    try {
      await dbClient.send(new DeleteTableCommand({ TableName: process.env.DYNAMO_TABLE_NAME }));
      await dbClient.send(new DeleteTableCommand({ TableName: process.env.PROJECTS_TABLE_NAME }));
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
  // Delete Cognito User Pool and App Client on Shutdown
  // ================================
  async function deleteCognitoResources(userPoolId, appClientId) {
    try {
      // Delete the App Client
      const deleteAppClientParams = {
        UserPoolId: userPoolId,
        ClientId: appClientId,
      };
      await cognitoClient.send(new DeleteUserPoolClientCommand(deleteAppClientParams));
      console.log(`💥 Cognito App Client for User Pool ${userPoolId} deleted.`);
  
      // Delete the User Pool
      const deleteUserPoolParams = {
        UserPoolId: userPoolId,
      };
      await cognitoClient.send(new DeleteUserPoolCommand(deleteUserPoolParams));
      console.log(`💥 Cognito User Pool ${userPoolId} deleted.`);
    } catch (err) {
      console.error('❌ Error deleting Cognito resources:', err);
    }
  }

  /**
 * Deletes a file after processing.
 */
function cleanupFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted file: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error deleting file: ${error.message}`);
  }
}

/**
 * Recursively deletes a directory and its contents.
 */
function cleanupDirectory(directoryPath) {
  try {
    if (fs.existsSync(directoryPath)) {
      fs.rmSync(directoryPath, { recursive: true, force: true });
      console.log(`🗑️ Deleted directory: ${directoryPath}`);
    }
  } catch (error) {
    console.error(`❌ Error deleting directory: ${error.message}`);
  }
}
  
  module.exports = { 
    deleteSBOMBucket, 
    deleteTables, 
    deleteCognitoResources,
    cleanupFile,
    cleanupDirectory
  };
  