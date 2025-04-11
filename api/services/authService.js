const { SignUpCommand, ConfirmSignUpCommand, InitiateAuthCommand, RevokeTokenCommand } = require('@aws-sdk/client-cognito-identity-provider');
const crypto = require('crypto');
const cognitoClient = require('./cognitoService');

function generateSecretHash(username) {
  const hmac = crypto.createHmac('sha256', process.env.COGNITO_CLIENT_SECRET);
  hmac.update(username + process.env.COGNITO_CLIENT_ID);
  return hmac.digest('base64');
}

async function signUp(username, password, email) {
  const params = {
    ClientId: process.env.COGNITO_CLIENT_ID,
    Username: username,
    Password: password,
    UserAttributes: [
      { Name: "email", Value: email }
    ],
    SecretHash: generateSecretHash(username),
  };

  const command = new SignUpCommand(params);
  const response = await cognitoClient.send(command);
  return response;
}

async function confirmSignUp(username, confirmationCode) {
  const params = {
    ClientId: process.env.COGNITO_CLIENT_ID,
    Username: username,
    ConfirmationCode: confirmationCode,
    SecretHash: generateSecretHash(username),
  };

  const command = new ConfirmSignUpCommand(params);
  const response = await cognitoClient.send(command);
  return response;
}

async function signIn(username, password) {
  const params = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: process.env.COGNITO_CLIENT_ID,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
      SECRET_HASH: generateSecretHash(username),
    },
  };

  const command = new InitiateAuthCommand(params);
  const response = await cognitoClient.send(command);

  return response.AuthenticationResult; // contains id_token, access_token, refresh_token
}

async function logoutUser(refreshToken) {
  const params = {
    ClientId: process.env.COGNITO_CLIENT_ID,
    ClientSecret: process.env.COGNITO_CLIENT_SECRET,
    Token: refreshToken
  };

  const command = new RevokeTokenCommand(params);
  const response = await cognitoClient.send(command);
  return response;
}

module.exports = { signUp, confirmSignUp, signIn };
