const pool = require('../config/database'); // Adjust the path to your db configuration file

const createCourse = async ({ title, description, category_id, video_url, price }) => {
  const [result] = await pool.query(
    `INSERT INTO Courses (title, description, category_id, video_url, price, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [title, description, category_id, video_url, price]
  );
  return result.insertId;
};

const getCourseById = async (course_id) => {
  const [rows] = await pool.query(
    'SELECT * FROM Courses WHERE course_id = ?',
    [course_id]
  );
  return rows[0];
};

module.exports = {
  createCourse,
  getCourseById
};
