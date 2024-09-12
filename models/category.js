const pool = require('../config/database'); // Adjust the path to your db configuration file

const createCategory = async ({ name, description }) => {
  const [result] = await pool.query(
    `INSERT INTO Categories (name, description) VALUES (?, ?)`,
    [name, description]
  );
  return result.insertId;
};

const getCategoryById = async (category_id) => {
  const [rows] = await pool.query(
    'SELECT * FROM Categories WHERE category_id = ?',
    [category_id]
  );
  return rows[0];
};

const getAllCategories = async () => {
  const [rows] = await pool.query('SELECT * FROM Categories');
  return rows;
};

module.exports = {
  createCategory,
  getCategoryById,
  getAllCategories
};
