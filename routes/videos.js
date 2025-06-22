const express = require('express');
const videoController = require('../controllers/videoController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Stream video route, protected by authentication
router.get('/course/:courseId', videoController.getCourseDetails);
router.get('/stream/:videoId', authMiddleware, videoController.streamVideo);
router.get('/mypurcahse', authMiddleware, videoController.getPurchasedVideoDetails);
router.get('/myPurses/:videoId', authMiddleware, videoController.streamVideos);
router.post('/getReviews', videoController.getReviews);




module.exports = router;
