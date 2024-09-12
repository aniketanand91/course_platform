const db = require('../config/database');

// Create a new payment record
exports.createPayment = async (paymentData) => {
  const query = `
    INSERT INTO payments (user_id, course_id, amount, payment_status, payment_date, order_id)
    VALUES (?, ?, ?, ?, NOW(), ?)
  `;
  const values = [paymentData.user_id, paymentData.course_id, paymentData.amount, paymentData.payment_status, paymentData.order_id];
  
  await db.query(query, values);
};

// Update payment status
exports.updatePaymentStatus = async (orderId, status, amount = null, transactionId = null) => {
  const query = `
    UPDATE payments
    SET payment_status = ?, amount = ?, payment_date = NOW(), transaction_id = ?
    WHERE order_id = ?
  `;
  const values = [status, amount, transactionId, orderId];
  
  await db.query(query, values);
};
