const pool = require('../config/database'); // Adjust the path to your db configuration file

const createCourse = async ({ title, description, category_id, sub_category, video_url, price }) => {
  const [result] = await pool.query(
    `INSERT INTO Courses (title, description, category_id, sub_category, video_url, price, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [title, description, category_id, sub_category, video_url, price]
  );
  return result.insertId;
};

const getCourse = async () => {
  const [rows] = await pool.query(
    `SELECT * FROM Courses;`  // No placeholders, so no parameters are needed here
  );
  return rows;  // Return all rows instead of just the first one
};

const getCourseById = async (course_id) => {
  const [rows] = await pool.query(
    'SELECT * FROM Courses WHERE course_id = ?',
    [course_id]
  );
  console.log(rows);
  return rows[0];
};

module.exports = {
  createCourse,
  getCourseById,
  getCourse
};
