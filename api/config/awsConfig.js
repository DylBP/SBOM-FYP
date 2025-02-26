const { S3Client } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { CognitoIdentityProviderClient } = require('@aws-sdk/client-cognito-identity-provider');

const s3 = new S3Client({ region: process.env.AWS_REGION });

const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dbClient);

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION })

module.exports = { s3, dbClient, docClient, cognitoClient };
