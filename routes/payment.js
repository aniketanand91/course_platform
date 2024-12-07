const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Payment routes
router.post('/initiate-payment',authMiddleware, paymentController.initiatePayment);
router.post('/paytm/callback', authMiddleware,  paymentController.handleRazorpayCallback);

module.exports = router;
