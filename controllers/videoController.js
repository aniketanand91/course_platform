const pool = require('../config/database');
const userModel = require('../models/user');
const videoModel = require('../models/videoModel');
const axios = require('axios'); // Use axios instead of request

// Proxy video stream if the user has access
exports.streamVideo = async (req, res) => {
  try {
    const userId = req.user.userId; // Extract userId from JWT token
    const { videoId } = req.params; // Get videoId from the route parameter

    console.log('UserID:', userId);
    console.log('VideoID:', videoId);

    // Check if the user has purchased the video
    const hasPurchased = await videoModel.checkPurchase(userId, videoId);
    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You need to purchase this video.',
      });
    }

    // Fetch the video URL from the database
    const query = 'SELECT video_url FROM courses WHERE course_id = ?';
    const [rows] = await pool.query(query, [videoId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Video not found in the database.',
      });
    }

    const videoUrl = rows[0].video_url;

    // Send the video URL to the client
    res.status(200).json({
      success: true,
      message: 'Video access granted.',
      data: {
        videoUrl,
      },
    });
  } catch (error) {
    console.error('Error streaming video:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request.',
      error: error.message,
    });
  }
};


