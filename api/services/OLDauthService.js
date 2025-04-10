import { SignUpCommand } from "@aws-sdk/client-cognito-identity-provider";
import cognitoClient from "./cognitoService.js";

export async function signUp(username, password, email) {
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
