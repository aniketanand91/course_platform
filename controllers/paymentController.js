const checksum_lib = require('paytmchecksum');
const { PAYTM_MID, PAYTM_MERCHANT_KEY, PAYTM_CHANNEL_ID, PAYTM_WEBSITE, PAYTM_INDUSTRY_TYPE, PAYTM_CALLBACK_URL, PAYTM_TRANSACTION_URL } = process.env;
const paymentModel = require('../models/payment');
const courseModel = require('../models/course');
const userModel = require('../models/user');

// Initiate Paytm payment
exports.initiatePayment = async (req, res) => {
  try {
    const { userId, courseId } = req.body;

    // Fetch course data
    const course = await courseModel.getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Fetch user data
    const user = await userModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate unique order ID
    const orderId = `ORDER_${new Date().getTime()}`;

    const paytmParams = {
      MID: PAYTM_MID,
      WEBSITE: PAYTM_WEBSITE,
      INDUSTRY_TYPE_ID: PAYTM_INDUSTRY_TYPE,
      CHANNEL_ID: PAYTM_CHANNEL_ID,
      ORDER_ID: orderId,
      CUST_ID: user.email, 
      TXN_AMOUNT: course.price.toString(),
      CALLBACK_URL: PAYTM_CALLBACK_URL,
      EMAIL: user.email,
      MOBILE_NO: user.mobile,
    };

    // Generate Paytm checksum
    const checksum = await checksum_lib.generateSignature(paytmParams, PAYTM_MERCHANT_KEY);
    paytmParams['CHECKSUMHASH'] = checksum;

    // Record the payment initiation
    await paymentModel.createPayment({
      user_id: userId,
      course_id: courseId,
      amount: course.price,
      order_id: orderId,
      payment_status: 'pending',
    });

    // Send params to frontend
    res.json({ url: PAYTM_TRANSACTION_URL, params: paytmParams });
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ error: 'Payment initiation failed' });
  }
};

// Handle Paytm callback
exports.handlePaytmCallback = async (req, res) => {
  try {
    const paytmResponse = req.body;
    const paytmChecksum = paytmResponse.CHECKSUMHASH;
    delete paytmResponse.CHECKSUMHASH;

    const isChecksumValid = await checksum_lib.verifySignature(paytmResponse, PAYTM_MERCHANT_KEY, paytmChecksum);
    if (!isChecksumValid) {
      return res.status(400).json({ error: 'Checksum mismatch' });
    }

    const { ORDERID, STATUS, TXNAMOUNT, TXNID, COURSEID, CUSTID } = paytmResponse;

    if (STATUS === 'TXN_SUCCESS') {
      await paymentModel.updatePaymentStatus(ORDERID, 'success', TXNAMOUNT, TXNID);
      await courseModel.grantUserVideoAccess(CUSTID, COURSEID);
      return res.status(200).json({ message: 'Payment successful' });
    } else {
      await paymentModel.updatePaymentStatus(ORDERID, 'failed');
      return res.status(400).json({ message: 'Payment failed' });
    }
  } catch (error) {
    console.error('Error handling Paytm callback:', error);
    res.status(500).json({ error: 'Callback handling failed' });
  }
};
