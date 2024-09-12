const express = require('express');
const videoController = require('../controllers/videoController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Stream video route, protected by authentication
router.get('/stream/:videoId', authMiddleware, videoController.streamVideo);


module.exports = router;
