const jwt = require("jsonwebtoken");
const jwkToPem = require("jwk-to-pem");
const axios = require("axios");

let pems;

async function getPems() {
  const url = `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`;
  const { data } = await axios.get(url);
  pems = {};
  data.keys.forEach(key => {
    pems[key.kid] = jwkToPem(key);
  });
}

async function authenticateToken(req, res, next) {
  if (!pems) {
    await getPems();
  }

  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }

  const decoded = jwt.decode(token, { complete: true });
  const pem = pems[decoded.header.kid];

  jwt.verify(token, pem, (err, payload) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.user = payload;
    next();
  });
}

module.exports = {
  authenticateToken,
};