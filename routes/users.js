const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const courseController = require('../controllers/courseController');

// Signup route
router.post('/signup', authController.signup);

router.post('/verifyOtp', authController.verifyOtpAndRegister);
// Login route
router.post('/login', authController.login);

// Google OAuth route
router.post('/google-oauth', authController.googleOAuth);

router.post('/ProjectSubmission', authMiddleware, courseController.submitProject);

router.post('/getProjectSubmissionDetails', authMiddleware, courseController.projectStatus);

router.post('/forgotPassword', authController.resetPassword);

router.post('/sendOTP', authController.sendOtpToMobile);

router.post('/reviewCourse', authMiddleware, courseController.courseReview);

module.exports = router;

