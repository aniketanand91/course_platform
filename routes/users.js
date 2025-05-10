const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const courseController = require('../controllers/courseController');

// Signup route
router.post('/signup', authController.signup);

// Login route
router.post('/login', authController.login);

// Google OAuth route
router.post('/google-oauth', authController.googleOAuth);

router.post('/ProjectSubmission', authMiddleware, courseController.submitProject);

router.post('/getProjectSubmissionDetails', authMiddleware, courseController.projectStatus);

module.exports = router;
