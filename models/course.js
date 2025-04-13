const pool = require('../config/database'); // Adjust the path to your db configuration file

const createCourse = async ({ title, description, category_id, sub_category, video_url, price, thumbnail, user_id }) => {
  const [result] = await pool.query(
    `INSERT INTO Courses (title, description, category_id, sub_category, video_url, price, thumbnail, user_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [title, description, category_id, sub_category, video_url, price, thumbnail, user_id]
  );
  return result.insertId;
};


const getCourse = async () => {
  const [rows] = await pool.query(
    `SELECT * FROM Courses WHERE is_live = TRUE`  
  );
  return rows;  
};

const getCourseForAdmin = async (user_id) => {
  console.log("+++++++++", user_id)
  const [rows] = await pool.query(
    'SELECT * FROM Courses WHERE user_id = ?',
    [user_id]
  );
  return rows;
};


const getCourseById = async (course_id) => {
  const [rows] = await pool.query(
    'SELECT * FROM Courses WHERE course_id = ?',
    [course_id]
  );
  return rows[0];
};

const getCourseWithPlaylist = async (courseId) => {
  // Fetch the course details
  const [course] = await pool.query('SELECT * FROM Courses WHERE course_id = ?', [courseId]);

  if (!course || course.length === 0) {
    throw new Error('Course not found');
  }

  // Fetch the videos associated with the course, ordered by position
  const playlist = await db.query(
    'SELECT video_url, description, position FROM course_videos WHERE course_id = ? ORDER BY position ASC',
    [courseId]
  );

  // Combine the course data with the playlist
  const courseWithPlaylist = {
    ...course[0], // Extract the first item (only one course is returned)
    playlist,     // Add the playlist of videos
  };

  return courseWithPlaylist;
};

const addVideoToCourse = async (videoData) => {
  const { course_id, video_url, description, position } = videoData;
  const [result] = await pool.query(
    'INSERT INTO course_videos (course_id, video_url, description, position) VALUES (?, ?, ?,?)',
    [course_id, video_url, description, position] 
  );
  return result.insertId;
};

module.exports = {
  createCourse,
  getCourseById,
  getCourse,
  addVideoToCourse,
  getCourseWithPlaylist,
  getCourseForAdmin
};
