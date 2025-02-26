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
 * Stores SBOM and vulnerability report metadata in DynamoDB.
 */
async function storeMetadata(filename, metadata, s3Key, vulnMetadata = null) {
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

  if (vulnMetadata) {
    dbParams.Item.vulnReport = {
      s3Location: vulnMetadata.s3Location,
      totalVulnerabilities: vulnMetadata.totalVulnerabilities,
      severityCounts: vulnMetadata.severityCounts,
    };
  }

  await docClient.send(new PutCommand(dbParams));
  console.log('✔️ Metadata stored in DynamoDB');
}


module.exports = { storeMetadata, createSBOMTable };
