const pool = require('../config/database');

// Get user by email
const getUserByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
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
  const { name, email, password, role, googleId } = user;
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password, role, google_id) VALUES (?, ?, ?, ?, ?)',
    [name, email, password || null, role || 'user', googleId || null]
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

module.exports = {
  getUserByEmail,
  getUserByGoogleId,
  createUser,
  getUserById,
  findOrCreateGoogleUser,
  linkGoogleIdToUser,
};
