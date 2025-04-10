const { SignUpCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { cognitoClient } = require('./cognitoService');

async function signUp(username, password, email) {
  const params = {
    ClientId: process.env.COGNITO_CLIENT_ID,
    Username: username,
    Password: password,
    UserAttributes: [
      { Name: "email", Value: email }
    ],
  };

  const command = new SignUpCommand(params);
  const response = await cognitoClient.send(command);
  return response;
}

module.exports = { signUp }