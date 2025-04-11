const { PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { CreateTableCommand } = require('@aws-sdk/client-dynamodb');
const { dbClient, docClient } = require('../config/awsConfig');
const { DYNAMO_TABLE_NAME } = require('../config/env');
const { unmarshall } = require("@aws-sdk/util-dynamodb");

/**
 * Creates the SBOM table
 */
async function createSBOMTable() {
  const params = {
    TableName: DYNAMO_TABLE_NAME,
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },      // Main Partition Key
      { AttributeName: 'userId', AttributeType: 'S' },  // GSI Key
    ],
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'UserIndex', // Name of the GSI
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' }, // GSI partition key
        ],
        Projection: {
          ProjectionType: 'ALL', // Return all attributes when querying by userId
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
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
async function storeMetadata(filename, metadata, s3Key, userId, vulnMetadata = null) {
  const { name, spdxId, creationInfo } = metadata;

  const item = {
    id: filename,
    userId,
    name,
    spdxId,
    createdAt: creationInfo,
    s3Location: s3Key,
    ...(vulnMetadata && { // Only add if vulnMetadata exists
      vulnReport: {
        s3Location: vulnMetadata.s3Location,
        totalVulnerabilities: vulnMetadata.totalVulnerabilities,
        severityCounts: vulnMetadata.severityCounts,
        highestSeverity: vulnMetadata.highestSeverity,
      }
    }),
  };

  const dbParams = {
    TableName: DYNAMO_TABLE_NAME,
    Item: item,
  };

  await docClient.send(new PutCommand(dbParams));
  console.log('✔️ Metadata stored in DynamoDB');
}

/**
 * Returns all SBOM dynamoDB records for a specific user.
 */
async function getUserSBOMs(userId) {
  const params = {
    TableName: DYNAMO_TABLE_NAME,
    IndexName: "UserIndex",
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: {
      ":uid": { S: userId },
    },
  };

  const command = new QueryCommand(params);
  const { Items } = await dbClient.send(command);

  return Items.map(item => unmarshall(item)); // Convert Dynamo format to JavaScript objects
}


module.exports = { storeMetadata, createSBOMTable, getUserSBOMs };
