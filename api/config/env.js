require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  AWS_REGION: process.env.AWS_REGION,
  S3_SBOM_BUCKET_NAME: process.env.S3_SBOM_BUCKET_NAME || 'sbom-files',
  DYNAMO_TABLE_NAME: process.env.DYNAMO_TABLE_NAME || 'sbom-table',
};
