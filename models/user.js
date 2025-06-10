const pool = require('../config/database');

// Get user by email
const getUserByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

const getUserByMobile = async (mobile) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE mobile = ?', [mobile]);
  return rows[0];
};
const storeOTP = async (mobile, otp) => {
  const query = `
    INSERT INTO user_otps (mobile, otp, created_at)
    VALUES (?, ?, NOW())
    ON DUPLICATE KEY UPDATE otp = VALUES(otp), created_at = NOW()
  `;
  await pool.query(query, [mobile, otp]);
};

const verifyOTP = async (mobile, otp) => {
  // Define OTP expiry duration in minutes
  const otpValidityMinutes = 5;

  // Query to check if OTP matches and is not expired
  const query = `
    SELECT * FROM user_otps 
    WHERE mobile = ? 
      AND otp = ? 
      AND created_at >= (NOW() - INTERVAL ? MINUTE)
  `;

  const [rows] = await pool.query(query, [mobile, otp, otpValidityMinutes]);

  if (rows.length === 0) {
    return false;
  }

  // OTP is valid, optionally delete or invalidate it after verification:
  await pool.query('DELETE FROM user_otps WHERE mobile = ?', [mobile]);

  return true;
};
// Get user by Google ID
const getUserByGoogleId = async (googleId) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE google_id = ?', [googleId]);
  return rows[0];
};

const linkGoogleIdToUser = async (userId, googleId) => {
  await pool.query('UPDATE users SET google_id = ? WHERE user_id = ?', [googleId, userId]);
};

// Create a new user
const createUser = async (user) => {
  const { name, mobile, email, password, role, googleId } = user;
  const [result] = await pool.query(
    'INSERT INTO users (name, mobile, email, password, role, google_id) VALUES (?, ?, ?, ?, ?, ?)',
    [name, mobile, email,  password || null, role || 'user', googleId || null]
  );
  return { id: result.insertId, ...user };
};

// Get user by ID
const getUserById = async (userId) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [userId]);
  return rows[0];
};

// Find or create a user based on Google OAuth profile
const findOrCreateGoogleUser = async (profile) => {
  const { id: googleId, displayName: name, emails } = profile;
  const email = emails[0].value;

  // Check if a user exists with the given Google ID
  let user = await getUserByGoogleId(googleId);
  if (!user) {
    // Check if a user exists with the given email (traditional signup or other OAuth)
    user = await getUserByEmail(email);
    if (!user) {
      // Create a new user if none exist
      user = await createUser({ name, email, password: null, role: 'user', googleId });
    } else {
      // Link Google account to the existing user
      await pool.query('UPDATE users SET google_id = ? WHERE email = ?', [googleId, email]);
      user.google_id = googleId;
    }
  }

  return user;
};

const updatePasswordByMobile = async (mobile, hashedPassword) => {
  await pool.query(`UPDATE users SET password = ? WHERE mobile = ?`, [hashedPassword, mobile]);
};


module.exports = {
  getUserByMobile,
  getUserByEmail,
  storeOTP,
  verifyOTP,
  getUserByGoogleId,
  createUser,
  getUserById,
  findOrCreateGoogleUser,
  linkGoogleIdToUser,
  updatePasswordByMobile,
};
