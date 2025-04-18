const { PutCommand, QueryCommand, GetCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { CreateTableCommand } = require('@aws-sdk/client-dynamodb');
const { dbClient, docClient } = require('../config/awsConfig');

/**
 * Creates the SBOM table
 */
async function createSBOMTable() {
  const params = {
    TableName: process.env.DYNAMO_TABLE_NAME,
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
    ...(vulnMetadata && {
      vulnReport: {
        s3Location: vulnMetadata.s3Location,
        totalVulnerabilities: vulnMetadata.totalVulnerabilities,
        severityCounts: vulnMetadata.severityCounts,
        highestSeverity: vulnMetadata.highestSeverity,
      }
    }),
  };

  const dbParams = {
    TableName: process.env.DYNAMO_TABLE_NAME,
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
    TableName: process.env.DYNAMO_TABLE_NAME,
    IndexName: "UserIndex",
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: {
      ":uid": userId,
    },
  };

  const command = new QueryCommand(params);
  const { Items } = await dbClient.send(command);

  console.log("🔍 Raw DynamoDB Items:", JSON.stringify(Items, null, 2));

  return Items;
}

/**
 * Fetch a single SBOM record by ID, only if owned by the specified user.
 */
async function getSbomRecord(sbomId, userId) {
  const params = {
    TableName: process.env.DYNAMO_TABLE_NAME,
    Key: {
      id: sbomId,
    },
    ConditionExpression: "userId = :uid",
    ExpressionAttributeValues: {
      ":uid": userId,
    },
  };

  try {
    const result = await docClient.send(new GetCommand(params));

    if (!result.Item) {
      console.log(`⚠️ SBOM with ID ${sbomId} not found.`);
      return null;
    }

    if (result.Item.userId !== userId) {
      console.log(`🚫 Unauthorized access: User ${userId} tried to access SBOM ${sbomId}`);
      throw new Error("Unauthorized");
    }

    console.log(`✅ Retrieved SBOM record with ID: ${sbomId} owned by User: ${userId}`);
    return result.Item;
  } catch (error) {
    console.error('❌ Error retrieving SBOM:', error);
    throw error;
  }
}

/**
 * Delete a single SBOM record, only if owned by the specified user.
 */
async function deleteSbomRecord(sbomId, userId) {
  const params = {
    TableName: process.env.DYNAMO_TABLE_NAME,
    Key: {
      id: sbomId,
    },
    ConditionExpression: "userId = :uid",
    ExpressionAttributeValues: {
      ":uid": userId,
    },
  };

  const command = new DeleteCommand(params);
  await docClient.send(command);

  console.log(`🗑️ Deleted SBOM record with ID: ${sbomId} owned by User: ${userId}`);
}

/**
 * Creates a project object
 */
async function createProject(userId, projectId, name, description = "", tags = []) {
  const params = {
    TableName: process.env.DYNAMO_TABLE_NAME,
    Item: {
      id: `PROJECT#${projectId}`,
      userId,
      projectId,
      name,
      description,
      tags,
      createdAt: new Date().toISOString(),
    },
    ConditionExpression: 'attribute_not_exists(id)', // Prevent overwrite
  };

  try {
    await docClient.send(new PutCommand(params));
    console.log(`📁 Project '${projectId}' created for user ${userId}`);
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      throw new Error('Project already exists');
    }
    console.error('❌ Error creating project:', err);
    throw err;
  }
}

module.exports = { storeMetadata, createSBOMTable, getUserSBOMs, getSbomRecord, deleteSbomRecord, createProject };
