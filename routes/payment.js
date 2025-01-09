const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

// Payment routes
router.post('/initiate-payment', authMiddleware, paymentController.initiatePayment);
router.post('/paytm/callback',  paymentController.handleRazorpayCallback);
router.post('/payment/applycoupon', authMiddleware, paymentController.applyCoupon);
router.post('/verify', authMiddleware, paymentController.verifyPayment);

module.exports = router;
