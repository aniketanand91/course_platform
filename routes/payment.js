const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

// Payment routes
router.post('/initiate-payment',authMiddleware, paymentController.initiatePayment);
router.post('/paytm/callback',  paymentController.handleRazorpayCallback);

module.exports = router;
