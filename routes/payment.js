const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Payment routes
router.post('/initiate-payment', paymentController.initiatePayment);
router.post('/paytm/callback', paymentController.handleRazorpayCallback);

module.exports = router;
