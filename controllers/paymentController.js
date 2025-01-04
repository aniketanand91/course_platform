const Razorpay = require('razorpay');
const crypto = require('crypto');
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_CALLBACK_URL } = process.env;
const paymentModel = require('../models/payment');
const courseModel = require('../models/course');
const userModel = require('../models/user');
const couponModel = require('../models/copoun');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});


exports.applyCoupon = async (req, res) => {
  const { userId, couponCode, amount } = req.body;
  console.log(userId);
  if (!userId || !couponCode || amount === undefined) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  try {
    // Fetch coupon details for the given coupon code and user
    const coupon = await couponModel.getCouponByCodeAndUser(couponCode, userId, amount);

    // If no valid coupon is found
    if (!coupon) {
      return res.status(400).json({ message: 'Invalid or expired coupon' });
    }

    // Calculate the discount amount (assuming coupon has discount percentage or value)
    const discountAmount = coupon; // or coupon.discount_percent if it's a percentage

    // Apply the discount to the amount (amount could be course price or another value)
    let finalAmount = amount - discountAmount;

    // Ensure the final amount is not less than zero
    if (finalAmount < 0) {
      finalAmount = 0;
    }

    return res.json({
      message: 'Coupon applied successfully !!',
      originalAmount: amount,
      discountAmount: discountAmount,
      finalAmount: finalAmount,
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    return res.status(400).json({ message: 'Invalid or expired coupon !!' });
  }
};



exports.initiatePayment = async (req, res) => {
  const { userId, courseId, couponCode } = req.body;

  // Validate input data
  if (!userId || !courseId || !couponCode) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Fetch course details
    const course = await courseModel.getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const user = await userModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const orderId = `ORDER_${new Date().getTime()}`;

    const discountAmount = await couponModel.applyCouponToAmount(couponCode, userId, course.price);
    console.log("Discount Amount:", discountAmount);

    const finalPrice = Math.max(course.price - discountAmount, 0); 

    const razorpayOrder = await razorpay.orders.create({
      amount: finalPrice * 100, 
      currency: 'INR',
      receipt: orderId,
      notes: {
        userId,
        courseId,
      },
    });

    // Record payment details in the database
    await paymentModel.createPayment({
      user_id: userId,
      course_id: courseId,
      amount: course.price,
      order_id: razorpayOrder.id,
      payment_status: 'pending',  
    });

    // Send response with Razorpay order details
    res.json({
      key: RAZORPAY_KEY_ID, // Public key for Razorpay
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: 'Recepitive',
      description: `Payment for ${course.name}`,
      image: 'http://localhost:3000/logo.png',
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
    console.error("Error initiating payment:", error.message);
    res.status(500).json({ error: 'Payment initiation failed. Please try again later.' });
  }
};



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

    await paymentModel.grantUserVideoAccess(payment.user_id, payment.course_id);

    res.status(200).json({ message: 'Payment successful' });
  } catch (error) {
    console.error('Error handling Razorpay callback:', error);
    res.status(500).json({ message: 'Callback handling failed' });
  }
};
