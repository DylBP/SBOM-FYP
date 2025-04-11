const { signupUser, loginUser, logoutUser, confirmSignUp } = require('../services/authService');

/**
 * Register a new user
 */
async function signup(req, res) {
  try {
    const { username, password, email } = req.body;
    const result = await signupUser(username, password, email);
    res.status(201).json({ message: 'User signed up successfully!', result });
  } catch (error) {
    console.error('Signup error:', error);

    let errorMessage = 'Failed to sign up';
    if (error.name === "InvalidPasswordException") {
      errorMessage = "Password does not meet complexity requirements.";
    } else if (error.name === "InvalidParameterException") {
      errorMessage = "Invalid signup parameters provided.";
    }

    res.status(400).json({ error: errorMessage, details: error.message });
  }
}

/**
 * Login user and return tokens
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;
    const tokens = await loginUser(username, password);
    res.status(200).json({ message: 'Login successful!', tokens });
  } catch (error) {
    console.error('Login error:', error);

    let errorMessage = 'Invalid credentials';
    if (error.name === "NotAuthorizedException") {
      errorMessage = "Incorrect username or password.";
    } else if (error.name === "UserNotConfirmedException") {
      errorMessage = "User account not confirmed. Please verify your email.";
    } else if (error.name === "UserNotFoundException") {
      errorMessage = "User does not exist.";
    }

    res.status(401).json({ error: errorMessage, details: error.message });
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

    let errorMessage = 'Failed to confirm signup';
    if (error.name === "CodeMismatchException") {
      errorMessage = "Invalid confirmation code.";
    } else if (error.name === "ExpiredCodeException") {
      errorMessage = "Confirmation code has expired. Please request a new one.";
    }

    res.status(400).json({ error: errorMessage, details: error.message });
  }
}

/**
 * Logout user
 */
async function logout(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required for logout.' });
    }

    await logoutUser(refreshToken);
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed', details: error.message });
  }
}

module.exports = { signup, login, logout, confirmSignup };