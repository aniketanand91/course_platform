const pool = require('../config/database');

const getUserByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
  return rows[0];
};

const createUser = async (user) => {
  const { name, email, password, role } = user;
  const [result] = await pool.query(
    'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, password, role]
  );
  return { id: result.insertId, ...user };
};


const getUserById = async (userId) => {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE user_id = ?', [userId]
  );
  return rows[0];
};

module.exports = {
  getUserByEmail,
  createUser,
  getUserById,
};
