const { CognitoIdentityProviderClient, SignUpCommand, AdminInitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');

// Load values from environment variables
const { AWS_REGION, COGNITO_USER_POOL_ID, COGNITO_APP_CLIENT_ID } = process.env;

// Create a new Cognito Identity Provider Client with region from environment variables
const cognitoClient = new CognitoIdentityProviderClient({ region: AWS_REGION });

/**
 * Signs up a new user to Cognito User Pool.
 */
async function signUpUser(username, email, password) {
  console.log('🔐 Signing up user:', username);
  const params = {
    ClientId: COGNITO_APP_CLIENT_ID,
    Username: username,
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email },
    ],
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
