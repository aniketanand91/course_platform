// controllers/adminController.js
const db = require('../config/database');

exports.approveCourse = async (req, res) => {
    const { course_id, is_live } = req.body;
  
    if (typeof course_id === 'undefined' || typeof is_live === 'undefined') {
      return res.status(400).json({ error: 'Course ID and is_live status are required' });
    }
  
    try {
      const [result] = await db.query(
        `UPDATE Courses SET is_live = ? WHERE course_id = ?`,
        [is_live, course_id]
      );
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Course not found' });
      }
  
      const action = is_live === 1 ? 'approved and made live' : 'disabled and taken offline';
      res.status(200).json({ message: `Course successfully ${action}` });
    } catch (error) {
      console.error('Error updating course status:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
  


// controllers/adminController.js

exports.getAllCoursesWithUser = async (req, res) => {
    try {
      const [courses] = await db.query(`
        SELECT 
          c.course_id,
          u.name AS uploader_name,
          c.title,
          c.price,
          c.is_live
        FROM 
          Courses c
        JOIN 
          users u ON c.user_id = u.user_id
        ORDER BY c.created_at DESC
      `);
  
      res.status(200).json({
        message: 'Courses fetched successfully',
        data: courses,
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };



  exports.getAllProjectSubmissions = async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT 
          ps.id,
          ps.user_id,
          ps.course_id,
          u.name AS user_name,
          u.email AS email_id,
          ps.submission_link,
          ps.status,
          c.title AS course_title
        FROM 
          ProjectSubmissions ps
        JOIN 
          users u ON ps.user_id = u.user_id
        JOIN 
          Courses c ON ps.course_id = c.course_id
      `);
  
      res.status(200).json(rows);
    } catch (err) {
      console.error('Error fetching project submissions:', err);
      res.status(500).json({ error: 'Database error' });
    }
  };
  


  exports.approveProjectSubmitted = async (req, res) => {
    const { user_id, course_id, status } = req.body;
  
    // Ensure the status is either 'Approved' or 'Rejected'
    if (status !== 'Approved' && status !== 'Rejected') {
      return res.status(400).json({ error: "Invalid status value. Must be 'Approved' or 'Rejected'." });
    }
  
    try {
      // Update the project submission status in the database
      const result = await db.query(
        'UPDATE ProjectSubmissions SET status = ? WHERE user_id = ? AND course_id = ?',
        [status, user_id, course_id]
      );
  
      // Check if the update was successful
      if (result.affectedRows > 0) {
        return res.status(200).json({ message: `Project submission ${status}` });
      } else {
        return res.status(200).json({ message: 'Submission not found or status already updated.' });
      }
    } catch (err) {
      console.error('Error updating project submission status:', err);
      return res.status(500).json({ error: 'Database error occurred while updating status.' });
    }
  };
  
  
  