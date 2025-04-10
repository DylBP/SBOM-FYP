const express = require('express');
const { signUp, signIn, confirmSignUp } = require('../services/authService');

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { username, password, email } = req.body;
  try {
    const data = await signUp(username, password, email);
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Sign up failed" });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const tokens = await signIn(username, password);
    res.status(200).json(tokens);
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Login failed" });
  }
});

router.post("/confirm", async (req, res) => {
  const { username, confirmationCode } = req.body;
  try {
    const data = await confirmSignUp(username, confirmationCode);
    res.status(200).json({ message: "User confirmed successfully!" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Confirmation failed", error: error.message });
  }
});

module.exports = router;
