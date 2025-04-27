const db = require('../config/database');

exports.createPayment = async (paymentData) => {
  const query = `
    INSERT INTO payments (user_id, course_id, amount, payment_status, payment_date, order_id)
    VALUES (?, ?, ?, ?, NOW(), ?)
  `;
  const values = [paymentData.user_id, paymentData.course_id, paymentData.amount, paymentData.payment_status, paymentData.order_id];
  
  await db.query(query, values);
};


exports.updatePaymentStatus = async (orderId, status, amount = null, transactionId = null) => {
  const query = `
    UPDATE payments
    SET payment_status = ?, amount = ?, payment_date = NOW(), transaction_id = ?
    WHERE order_id = ?
  `;
  const values = [status, amount, transactionId, orderId];
  
  await db.query(query, values);
};

// In paymentModel.js
exports.getPaymentByOrderId = async (orderId) => {
  try {
    const query = `
      SELECT * FROM payments WHERE order_id = ?;
    `;
    const [rows] = await db.execute(query, [orderId]);
    
    if (rows.length === 0) {
      return null; // No payment record found
    }

    return rows[0]; // Return the first record if found
  } catch (error) {
    console.error('Error getting payment by order ID:', error);
    throw new Error('Failed to fetch payment');
  }
};


exports.grantUserVideoAccess = async (user_id, course_id) => {
  const query = `
  INSERT INTO purchases (user_id, video_id, purchase_date, expiry_date)
  VALUES (?, ?, CURRENT_TIMESTAMP, NULL);
  `
  const values = [user_id, course_id];

  await db.query(query, values);
}
