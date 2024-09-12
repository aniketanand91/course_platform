const userModel = require('../models/user');
const videoModel = require('../models/videoModel');
const axios = require('axios'); // Use axios instead of request

// Proxy video stream if the user has access
exports.streamVideo = async (req, res) => {
  try {
    // Extract userId from the nested structure
    const userId = req.user.user.id; 
    const { videoId } = req.params;

    console.log('UserID:', userId); // Debug output
    console.log('VideoID:', videoId); // Debug output

    // Check if the user has purchased this video
    const hasPurchased = await videoModel.checkPurchase(userId, videoId);
    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You need to purchase this video.'
      });
    }

    // Send the YouTube video URL for embedding
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    res.status(200).json({
      success: true,
      message: 'Video access granted.',
      data: {
        videoUrl
      }
    });

  } catch (error) {
    console.error('Error streaming video:', error); // Debug output
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request.',
      error: error.message
    });
  }
};

