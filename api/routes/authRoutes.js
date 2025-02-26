const express = require('express');
const { signUpUser, signInUser } = require('../services/authService');
const router = express.Router();

/**
 * Signup route for new users.
 * POST /auth/signup
 */
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const signUpResponse = await signUpUser(email, password);
    res.status(200).json({
      message: 'User signed up successfully',
      userSub: signUpResponse.UserSub,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error signing up user', error: error.message });
  }
});

/**
 * Signin route for existing users.
 * POST /auth/signin
 */
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const authResult = await signInUser(email, password);
    res.status(200).json({
      message: 'User signed in successfully',
      tokens: authResult,  // This will return the access token, id token, refresh token, etc.
    });
  } catch (error) {
    res.status(500).json({ message: 'Error signing in user', error: error.message });
  }
});

module.exports = router;
