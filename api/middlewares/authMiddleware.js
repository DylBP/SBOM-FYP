const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const axios = require('axios');

// Cache keys (JWKs) from Cognito
let pems;

async function getPems() {
  const url = `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`;
  const { data } = await axios.get(url);
  pems = {};
  data.keys.forEach(key => {
    pems[key.kid] = jwkToPem(key);
  });
}

// Authentication middleware
async function authenticateToken(req, res, next) {
  if (!pems) {
    await getPems();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  // Decode the token header to find which key was used
  const decoded = jwt.decode(token, { complete: true });

  if (!decoded || !decoded.header || !decoded.header.kid) {
    return res.status(401).json({ message: "Invalid token" });
  }

  const pem = pems[decoded.header.kid];

  if (!pem) {
    return res.status(401).json({ message: "Invalid token signature" });
  }

  // Verify the token
  jwt.verify(token, pem, { issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}` }, (err, payload) => {
    if (err) {
      return res.status(401).json({ message: "Token verification failed" });
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return res.status(401).json({ message: "Token has expired" });
    }
    
    req.user = payload; // Save decoded token payload (user info) to request
    next();
  });
}

module.exports = { authenticateToken };
