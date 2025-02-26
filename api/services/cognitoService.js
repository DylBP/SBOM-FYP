const { CognitoIdentityProviderClient, CreateUserPoolCommand, CreateUserPoolClientCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { COGNITO_REGION } = require('../config/env');

// Initialize Cognito Identity Provider Client
const cognitoClient = new CognitoIdentityProviderClient({ region: COGNITO_REGION });

/**
 * Create a Cognito User Pool
 */
async function createUserPool() {
  const params = {
    PoolName: 'sbom-user-pool',
    AliasAttributes: ['email'],
    AutoVerifiedAttributes: ['email'],
    Policies: {
      PasswordPolicy: {
        MinimumLength: 8,
        RequireUppercase: false,
        RequireLowercase: false,
        RequireNumbers: false,
        RequireSymbols: false,
      },
    },
    MfaConfiguration: 'OFF',
  };

  try {
    const createUserPoolResponse = await cognitoClient.send(new CreateUserPoolCommand(params));
    console.log('✔️ User Pool Created:', createUserPoolResponse.UserPool.Id);

    // Return the created pool ID
    return createUserPoolResponse.UserPool.Id;
  } catch (error) {
    console.error('❌ Error creating user pool:', error);
    throw error;
  }
}

/**
 * Create a Cognito User Pool Client
 */
async function createUserPoolClient(userPoolId) {
  const params = {
    UserPoolId: userPoolId,
    ClientName: 'SBOMAppClient',
    GenerateSecret: false,
    RefreshTokenValidity: 30,
    ExplicitAuthFlows: ['ADMIN_NO_SRP_AUTH', 'USER_PASSWORD_AUTH'],
    PreventUserExistenceErrors: 'ENABLED',
  };

  try {
    const createUserPoolClientResponse = await cognitoClient.send(new CreateUserPoolClientCommand(params));
    console.log('✔️ User Pool Client Created:', createUserPoolClientResponse.UserPoolClient.ClientId);

    // Return the app client ID
    return createUserPoolClientResponse.UserPoolClient.ClientId;
  } catch (error) {
    console.error('❌ Error creating user pool client:', error);
    throw error;
  }
}

module.exports = { createUserPool, createUserPoolClient };
