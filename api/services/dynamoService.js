const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { CreateTableCommand, DeleteTableCommand } = require('@aws-sdk/client-dynamodb');
const { dbClient, docClient } = require('../config/awsConfig');
const { DYNAMO_TABLE_NAME } = require('../config/env');

/**
 * Creates the SBOM table
 */
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

/**
 * Stores SBOM metadata in DynamoDB.
 */
async function storeMetadata(filename, metadata, s3Key) {
  const dbParams = {
    TableName: DYNAMO_TABLE_NAME,
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
 * Deletes the SBOM table
 */
async function deleteSBOMTable() {
  const params = {
    TableName: 'sbom-table',
  };

  try {
    const data = await dbClient.send(new DeleteTableCommand(params));
    console.log('💥 DynamoDB table "sbom-table" deleted:', data.TableDescription.TableName);
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      console.log('⚠️ DynamoDB table "sbom-table" does not exist.');
    } else {
      console.error('❌ Error deleting DynamoDB table:', err);
    }
  }
}

module.exports = { storeMetadata, createSBOMTable, deleteSBOMTable };
