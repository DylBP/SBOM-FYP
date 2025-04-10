const { CognitoIdentityProviderClient, SignUpCommand, AdminInitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');
const crypto = require('crypto');

const { AWS_REGION, COGNITO_USER_POOL_ID, COGNITO_APP_CLIENT_ID } = process.env;
const cognitoClient = new CognitoIdentityProviderClient({ region: AWS_REGION });

/**
 * Generates a secret hash for Cognito.
 */
function generateSecretHash(email, clientId, clientSecret) {
  console.log("Client Secret:", clientSecret); // Debugging the client secret

  if (!clientSecret) {
    throw new Error("Client secret is undefined or empty. Please check your environment variable.");
  }

  const hmac = crypto.createHmac('sha256', clientSecret);
  hmac.update(email + clientId);
  return hmac.digest('base64');
}

/**
 * Signs up a new user to Cognito User Pool.
 */
async function signUpUser(username, email, password) {
  console.log('🔐 Signing up user:', username);

  const secretHash = generateSecretHash(email, COGNITO_APP_CLIENT_ID, process.env.COGNITO_APP_CLIENT_ID);

  const params = {
    ClientId: COGNITO_APP_CLIENT_ID,
    Username: username,
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email },
    ],
    SecretHash: secretHash,  // Include the SECRET_HASH here
  };

  try {
    const signUpResponse = await cognitoClient.send(new SignUpCommand(params));
    console.log('✔️ User signed up successfully:', signUpResponse.UserSub);
    return signUpResponse;
  } catch (error) {
    console.error('❌ Error signing up:', error);
    throw error;
  }
}


/**
 * Signs in an existing user.
 */
async function signInUser(email, password) {
  const params = {
    AuthFlow: 'ADMIN_NO_SRP_AUTH',
    ClientId: COGNITO_APP_CLIENT_ID,
    UserPoolId: COGNITO_USER_POOL_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  };

  try {
    const signInResponse = await cognitoClient.send(new AdminInitiateAuthCommand(params));
    console.log('✔️ User signed in successfully:', signInResponse.AuthenticationResult);
    return signInResponse.AuthenticationResult;
  } catch (error) {
    console.error('❌ Error signing in:', error);
    throw error;
  }
}

module.exports = { signUpUser, signInUser };
