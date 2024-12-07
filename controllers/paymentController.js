const Razorpay = require('razorpay');
const crypto = require('crypto');
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_CALLBACK_URL } = process.env;
const paymentModel = require('../models/payment');
const courseModel = require('../models/course');
const userModel = require('../models/user');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// Initiate Razorpay payment
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

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: course.price * 100, // Amount in smallest currency unit (paise)
      currency: 'INR',
      receipt: orderId,
      notes: {
        userId: userId,
        courseId: courseId,
      },
    });

    // Record the payment initiation
    await paymentModel.createPayment({
      user_id: userId,
      course_id: courseId,
      amount: course.price,
      order_id: razorpayOrder.id,
      payment_status: 'pending',
    });

    // Send order details to frontend
    res.json({
      key: RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: 'Your Platform Name',
      description: `Payment for ${course.name}`,
      image: 'https://your-logo-url.com/logo.png', // Optional
      order_id: razorpayOrder.id,
      callback_url: RAZORPAY_CALLBACK_URL,
      prefill: {
        name: user.name,
        email: user.email,
        contact: user.mobile,
      },
      theme: {
        color: '#F37254',
      },
    });
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ error: 'Payment initiation failed' });
  }
};

// Handle Razorpay callback
exports.handleRazorpayCallback = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify Razorpay signature
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Signature verification failed' });
    }

    // Update payment status
    const payment = await paymentModel.getPaymentByOrderId(razorpay_order_id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    await paymentModel.updatePaymentStatus(razorpay_order_id, 'success', payment.amount, razorpay_payment_id);


    // Grant access to the course
    await paymentModel.grantUserVideoAccess(payment.user_id, payment.course_id);

    res.status(200).json({ message: 'Payment successful' });
  } catch (error) {
    console.error('Error handling Razorpay callback:', error);
    res.status(500).json({ error: 'Callback handling failed' });
  }
};
