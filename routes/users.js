const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Signup route
router.post('/signup', authController.signup);

// Login route
router.post('/login', authController.login);

// Google OAuth route
router.post('/google-oauth', authController.googleOAuth);

module.exports = router;
