const { PutCommand, QueryCommand, GetCommand, DeleteCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { CreateTableCommand } = require('@aws-sdk/client-dynamodb');
const { dbClient, docClient } = require('../config/awsConfig');

const SBOM_TABLE = process.env.DYNAMO_SBOM_TABLE;
const PROJECTS_TABLE = process.env.DYNAMO_PROJECTS_TABLE;

// Projects Structure ------------------------------------------------------

/**
 * Creates the Projects Table
 */
async function createProjectsTable() {
  const params = {
    TableName: PROJECTS_TABLE,
    AttributeDefinitions: [
      { AttributeName: 'userId',    AttributeType: 'S' },
      { AttributeName: 'projectId', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'userId',    KeyType: 'HASH' },
      { AttributeName: 'projectId', KeyType: 'RANGE' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
    GlobalSecondaryIndexes: [{
      IndexName: 'projectId-userId-index',
      KeySchema: [
        { AttributeName: 'projectId', KeyType: 'HASH' },
        { AttributeName: 'userId',    KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
    }],
  };
  await dbClient.send(new CreateTableCommand(params));
}

async function putProject(userId, projectId, attrs) {
  const now = new Date().toISOString();
  const params = {
    TableName: PROJECTS_TABLE,
    Item: {
      userId,
      projectId,
      createdAt: now,
      updatedAt: now,
      ...attrs,                 // name, description, tags…
    },
    ConditionExpression: 'attribute_not_exists(projectId)',
  };
  await docClient.send(new PutCommand(params));
}

async function getProject(userId, projectId) {
  const params = {
    TableName: PROJECTS_TABLE,
    Key: { userId, projectId },
  };
  const { Item } = await docClient.send(new GetCommand(params));
  return Item;
}

async function listProjects(userId) {
  const params = {
    TableName: PROJECTS_TABLE,
    KeyConditionExpression: 'userId = :u',
    ExpressionAttributeValues: { ':u': userId },
  };
  const { Items } = await docClient.send(new QueryCommand(params));
  return Items;
}

async function updateProject(userId, projectId, attrs) {
  const now = new Date().toISOString();
  const paramKeys = Object.keys(attrs);
  const setExpr = paramKeys
      .map((k, i) => `#f${i} = :v${i}`)
      .join(', ');
  const ExpressionAttributeNames  = {};
  const ExpressionAttributeValues = {};
  paramKeys.forEach((k, i) => {
    ExpressionAttributeNames[`#f${i}`]  = k;
    ExpressionAttributeValues[`:v${i}`] = attrs[k];
  });
  ExpressionAttributeNames['#upd']  = 'updatedAt';
  ExpressionAttributeValues[':upd'] = now;

  const params = {
    TableName: PROJECTS_TABLE,
    Key: { userId, projectId },
    UpdateExpression: `SET ${setExpr}, #upd = :upd`,
    ConditionExpression: 'attribute_exists(projectId)',
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  };
  const { Attributes } = await docClient.send(new UpdateCommand(params));
  return Attributes;
}

async function deleteProject(userId, projectId) {
  const params = {
    TableName: PROJECTS_TABLE,
    Key: { userId, projectId },
    ConditionExpression: 'attribute_exists(projectId)',
  };
  await docClient.send(new DeleteCommand(params));
}

async function getProjectSBOMs(projectId) {
  const params = {
    TableName: SBOM_TABLE,
    IndexName: 'projectId-index',
    KeyConditionExpression: "projectId = :p",
    ExpressionAttributeValues: { ':p': projectId}
  };

  const { Items } = await docClient.send(new QueryCommand(params));
  return Items;
}

// SBOM Structure ------------------------------------------------------

/**
 * Creates the SBOM table
 */
async function createSBOMTable() {
  const params = {
    TableName: SBOM_TABLE,
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },      // Main Partition Key
      { AttributeName: 'userId', AttributeType: 'S' },  // GSI Key
      { AttributeName: 'projectId', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' },
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
      },
      {
        IndexName: 'projectId-index',
        KeySchema: [
          { AttributeName: 'projectId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
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
async function storeMetadata(filename, metadata, s3Key, userId, projectId, vulnMetadata = null) {
  const { name, spdxId, creationInfo } = metadata;

  const item = {
    id: filename,
    userId,
    projectId,
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
    TableName: SBOM_TABLE,
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
    TableName: SBOM_TABLE,
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
    TableName: SBOM_TABLE,
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
    TableName: SBOM_TABLE,
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

module.exports = { 
  storeMetadata,
  createSBOMTable,
  getUserSBOMs,
  getSbomRecord,
  deleteSbomRecord,
  createProjectsTable,
  putProject,
  getProject,
  listProjects,
  updateProject,
  deleteProject,
  getProjectSBOMs };
