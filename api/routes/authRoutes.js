const express = require('express');
const { signUpUser, signInUser } = require('../services/authService');

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

module.exports = router;
