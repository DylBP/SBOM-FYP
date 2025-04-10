const CognitoExpress = require('cognito-express');
const { COGNITO_USER_POOL_ID, AWS_REGION } = require('../config/env');

const cognitoExpress = new CognitoExpress({
  region: AWS_REGION,
  cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: 'access', // 'access' or 'id' depending on the token you are using
  tokenExpiration: 3600000, // 1 hour
});

/**
 * Middleware to check if the JWT token is valid.
 */
function authMiddleware(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  // Remove Bearer prefix if present
  const tokenWithoutBearer = token.startsWith('Bearer ') ? token.slice(7) : token;

  cognitoExpress.validate(tokenWithoutBearer, function (err, response) {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token', error: err.message });
    }

    // Attach the user's information to the request object (optional)
    req.user = response;

    // Proceed to the next middleware or route handler
    next();
  });
}

module.exports = authMiddleware;
