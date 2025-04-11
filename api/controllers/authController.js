const { signUp, signIn, logoutUser, confirmSignUp } = require('../services/authService');

/**
 * Register a new user
 */
async function signup(req, res) {
  try {
    const { email, password } = req.body;
    const result = await signUp(email, password);
    res.status(201).json({ message: 'User signed up successfully!', result });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to sign up', details: error.message });
  }
}

/**
 * Login user and return tokens
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const tokens = await signIn(email, password);
    res.status(200).json({ message: 'Login successful!', tokens });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid credentials', details: error.message });
  }
}

/**
 * Confirm sign up
 */
async function confirmSignup(req, res) {
  try {
    const { username, confirmationCode } = req.body;
    const result = await confirmSignUp(username, confirmationCode);
    res.status(200).json({ message: 'User confirmed successfully!', result });
  } catch (error) {
    console.error('Confirm signup error:', error);
    res.status(500).json({ error: 'Failed to confirm signup', details: error.message });
  }
}

/**
 * Logout user (invalidate tokens if needed)
 */
async function logout(req, res) {
  try {
    await logoutUser(req.user); // Assuming req.user is populated by authMiddleware
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed', details: error.message });
  }
}

module.exports = { signup, login, logout, confirmSignup };
