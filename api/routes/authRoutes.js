const AWS = require('aws-sdk');
const { COGNITO_USER_POOL_ID, COGNITO_APP_CLIENT_ID, AWS_REGION } = require('../config/env');

AWS.config.update({ region: AWS_REGION });

const cognito = new AWS.CognitoIdentityServiceProvider();

/**
 * Signup user with AWS Cognito
 */
async function signUpUser(email, password, username) {
  const params = {
    ClientId: COGNITO_APP_CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'preferred_username', Value: username },
    ],
  };

  return cognito.signUp(params).promise();
}

/**
 * Sign in user and retrieve JWT tokens
 */
async function signInUser(email, password) {
  const params = {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: COGNITO_APP_CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  };

  const authResponse = await cognito.initiateAuth(params).promise();
  return {
    accessToken: authResponse.AuthenticationResult.AccessToken,
    idToken: authResponse.AuthenticationResult.IdToken,
    refreshToken: authResponse.AuthenticationResult.RefreshToken,
  };
}

module.exports = { signUpUser, signInUser };
