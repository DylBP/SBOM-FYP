const express = require('express');
const router = express.Router();
const { signup, login, confirmSignup, logout } = require('../controllers/authController');

router.post("/signup", signup);
router.post("/login", login);
router.post("/confirm", confirmSignup);
router.post("/logout", logout);

module.exports = router;
