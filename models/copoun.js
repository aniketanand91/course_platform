const db = require('../config/database'); 

const getCouponByCodeAndUser = async (couponCode, userId, amount) => {
  try {
    const query = `
      SELECT * FROM coupons 
      WHERE coupon_name = ? AND user_id = ? AND used = 0
    `;
    const [coupon] = await db.query(query, [couponCode, userId]);
    const couponValue = coupon[0].coupon_value;
    const discountAmount = (couponValue / 100) * amount; // Percentage of amount
    const finalDiscountAmount = Math.min(discountAmount, amount); // Ensure discount doesn't exceed the amount

    return finalDiscountAmount;
  } catch (error) {
    console.error('Error fetching coupon:', error);
    throw new Error('Unable to fetch coupon');
  }
};

const applyCouponToAmount = async (couponCode, userId, amount) => {
    console.log(couponCode);  // To debug and ensure couponCode is being passed correctly
    if (!couponCode || !userId || !amount || amount <= 0) {
        return 0;
    }

    try {
        // Query to check coupon eligibility
        const query = `
            SELECT coupon_value
            FROM coupons
            WHERE coupon_name = ? 
            AND user_id = ? 
            AND used = 0
            LIMIT 1
        `;
        
        // Corrected line: using couponCode instead of coupon
        const [result] = await db.query(query, [couponCode, userId]);

        // Handle case where no valid coupon is found
        if (!result.length) {
            console.warn("Coupon is either expired, already used, or not applicable.");
            return 0;  // No discount is applied
        }

        // Calculate the discount amount
        const couponValue = result[0].coupon_value;
        const discountAmount = (couponValue / 100) * amount; // Percentage of amount
        const finalDiscountAmount = Math.min(discountAmount, amount); // Ensure discount doesn't exceed the amount

        return finalDiscountAmount;

    } catch (error) {
        console.error("Error applying coupon:", error.message);
        throw new Error("An error occurred while processing the coupon. Please try again.");
    }
};




const markCouponAsUsed = async (couponCode, userId) => {
  try {
    const query = `
      UPDATE coupons 
      SET used = 1 
      WHERE coupon_name = ? AND user_id = ? AND used = 0
    `;
    await db.query(query, [couponCode, userId]);
  } catch (error) {
    console.error('Error updating coupon status:', error);
    throw new Error('Unable to mark coupon as used');
  }
};

module.exports = {
  getCouponByCodeAndUser,
  applyCouponToAmount,
  markCouponAsUsed
};
