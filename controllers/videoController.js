const userModel = require('../models/user');
const videoModel = require('../models/video');
const request = require('request');

// Proxy video stream if the user has access
exports.streamVideo = async (req, res) => {
  try {
    const { userId } = req.user; // Assuming the user is authenticated with JWT
    const { videoId } = req.params;

    // Check if the user has purchased this video
    const hasPurchased = await videoModel.checkPurchase(userId, videoId);
    if (!hasPurchased) {
      return res.status(403).json({ error: 'You need to purchase this video.' });
    }

    // Fetch the YouTube video and proxy the stream
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    request(videoUrl).pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to stream the video' });
  }
};
