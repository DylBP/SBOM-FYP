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

    let errorMessage = "Sign up failed";
    if (error.name === "InvalidPasswordException") {
      errorMessage = "Password does not meet complexity requirements.";
    } else if (error.name === "InvalidParameterException") {
      errorMessage = "Invalid signup parameters provided.";
    }

    res.status(400).json({ 
      message: errorMessage,
      detail: error.message
    });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const tokens = await signIn(username, password);
    res.status(200).json(tokens);
  } catch (error) {
    console.error(error);

    let errorMessage = "Login failed";
    if (error.name === "NotAuthorizedException") {
      errorMessage = "Incorrect username or password.";
    } else if (error.name === "UserNotConfirmedException") {
      errorMessage = "User account not confirmed. Please verify your email.";
    } else if (error.name === "UserNotFoundException") {
      errorMessage = "User does not exist.";
    }

    res.status(401).json({ 
      message: errorMessage,
      detail: error.message
    });
  }
});


router.post("/confirm", async (req, res) => {
  const { username, confirmationCode } = req.body;
  try {
    const data = await confirmSignUp(username, confirmationCode);
    res.status(200).json({ message: "User confirmed successfully!" });
  } catch (error) {
    console.error(error);

    let errorMessage = "Confirmation failed";
    if (error.name === "CodeMismatchException") {
      errorMessage = "Invalid confirmation code.";
    } else if (error.name === "ExpiredCodeException") {
      errorMessage = "Confirmation code has expired. Please request a new one.";
    }

    res.status(400).json({ 
      message: errorMessage,
      detail: error.message
    });
  }
});


module.exports = router;
