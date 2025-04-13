const db = require('../config/database');

exports.checkPurchase = async (userId, videoId) => {
  const query = 'SELECT * FROM purchases WHERE user_id = ? AND video_id = ?';
  const [rows] = await db.query(query, [userId, videoId]);
  return rows.length > 0;
};


// Function to fetch course details by ID
exports.getCourseById = async (courseId) => {
  const query = 'SELECT * FROM courses WHERE course_id = $1';
  const values = [courseId];
  
  try {
    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching course data:', error);
    throw new Error('Error fetching course data');
  }
};
