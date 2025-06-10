const pool = require('../config/database');
const userModel = require('../models/user');
const videoModel = require('../models/videoModel');
const axios = require('axios'); 
const AWS = require('aws-sdk');
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET_NAME } = process.env;


if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION || !AWS_S3_BUCKET_NAME) {
  throw new Error('AWS credentials or bucket name are not set in environment variables.');
}

const s3 = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params; // Extract courseId from the route parameter

    console.log('Fetching details for CourseID:', courseId);

    // Query to fetch course details excluding the video URL
const query = `
    SELECT 
        c.course_id, 
        c.title, 
        c.description, 
        c.category_id AS categoryId, 
        c.sub_category AS subCategory, 
        c.price, 
        c.thumbnail, 
        c.created_at AS createdAt, 
        c.updated_at AS updatedAt,
        cv.position,
        cv.description AS video_description, 
        CASE 
            WHEN cv.position = 0 THEN cv.video_url
            ELSE NULL
        END AS video_url,
        (
            SELECT 
                AVG(rating) 
            FROM 
                CourseReviews 
            WHERE 
                course_id = c.course_id
        ) AS average_rating
    FROM 
        Courses c
    LEFT JOIN 
        course_videos cv ON c.course_id = cv.course_id
    WHERE 
        c.course_id = ?
    ORDER BY 
        cv.position
`;

const [rows] = await pool.query(query, [courseId]);

// Structure the result in the desired format
const course = {
  course_id: rows[0].course_id,
  title: rows[0].title,
  description: rows[0].description,
  categoryId: rows[0].categoryId,
  subCategory: rows[0].subCategory,
  price: rows[0].price,
  thumbnail: rows[0].thumbnail,
  createdAt: rows[0].createdAt,
  updatedAt: rows[0].updatedAt,
  average_rating: rows[0].average_rating, // Added line
  videos: rows.map(video => ({
    position: video.position,
    video_description: video.video_description,
    video_url: video.video_url // Null for positions other than 0
  }))
};


    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    const courseDetails = rows[0];

    res.status(200).json({
      success: true,
      message: 'Course details fetched successfully.',
      data: course,
    });
  } catch (error) {
    console.error('Error fetching course details:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching course details.',
      error: error.message,
    });
  }
};

exports.getPurchasedVideoDetails = async (req, res) => {
  try {
    const userId = req.user.userId; // Extract userId from JWT token

    // Query to fetch all purchased videos by the user within 90 days
    const purchaseQuery = `
      SELECT video_id FROM purchases
      WHERE user_id = ? AND purchase_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)
    `;
    const [purchaseRows] = await pool.query(purchaseQuery, [userId]);

    if (purchaseRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No records found.',
      });
    }

    // Extract video IDs from the purchase records
    const videoIds = purchaseRows.map(row => row.video_id);

    // Query to fetch video details from the courses table
    const videoQuery = `
      SELECT course_id, title, description, category_id, video_url, price, sub_category, thumbnail
      FROM Courses
      WHERE course_id IN (?)`;
    const [videoDetails] = await pool.query(videoQuery, [videoIds]);

    if (videoDetails.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No video details found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Purchased video details fetched successfully.',
      data: videoDetails,
    });
  } catch (error) {
    console.error('Error fetching purchased video details:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching purchased video details.',
      error: error.message,
    });
  }
};




exports.streamVideo = async (req, res) => {
  try {
    const userId = req.user.userId; 
    const { videoId } = req.params; 

    console.log('UserID:', userId);
    console.log('VideoID:', videoId);

    
    const hasPurchased = await videoModel.checkPurchase(userId, videoId);
    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You need to purchase this video.',
      });
    }

    // Fetch the video URL from the database
    const query = 'SELECT * FROM Courses WHERE course_id = ?';
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

// exports.streamVideos = async (req, res) => {
//   const { videoId } = req.params;
//   try {
//     const userId = req.user?.userId;
//     if (!videoId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Video ID is required.',
//       });
//     }

//     const hasPurchased = await videoModel.checkPurchase(userId, videoId);
//     if (!hasPurchased) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied. You need to purchase this video.',
//       });
//     }


//     const query = 'SELECT * FROM Courses WHERE course_id = ?';
//     const [rows] = await pool.query(query, [videoId]);

//     const query1 = 'SELECT * FROM course_videos WHERE course_id = ? ORDER BY position ASC'
//     const [playlist] = await pool.query( query1, [videoId] );
//     if (rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Video not found in the database.',
//       });
//     }

//     const videoKey = rows[0].video_url;

//     if (!videoKey) {
//       return res.status(500).json({
//         success: false,
//         message: 'Video URL is missing in the database.',
//       });
//     }



//     res.status(200).json({
//       success: true,
//       message: 'Video access granted.',
//       data: {
//         metadata:rows,
//         playlist:playlist
//       },
//     });
//   } catch (error) {
//     console.error('Error streaming video:', error);
//     res.status(500).json({
//       success: false,
//       message: 'An error occurred while processing your request.',
//       error: error.message,
//     });
//   }
// };

exports.streamVideos = async (req, res) => {
  const { videoId } = req.params;

  try {
    const userId = req.user?.userId;
    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'Video ID is required.',
      });
    }

    // Fetch the user and check their role
    const user = await userModel.getUserById(userId);

    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

    // Check purchase only if not admin
    if (!isAdmin) {
      const hasPurchased = await videoModel.checkPurchase(userId, videoId);
      if (!hasPurchased) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You need to purchase this video.',
        });
      }
    }

    // Fetch course details
    const [courseRows] = await pool.query(
      'SELECT * FROM Courses WHERE course_id = ?',
      [videoId]
    );

    if (courseRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Video not found in the database.',
      });
    }

    const [playlist] = await pool.query(
      'SELECT * FROM course_videos WHERE course_id = ? ORDER BY position ASC',
      [videoId]
    );

    const videoKey = courseRows[0].video_url;

    if (!videoKey) {
      return res.status(500).json({
        success: false,
        message: 'Video URL is missing in the database.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Video access granted.',
      data: {
        metadata: courseRows,
        playlist: playlist,
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



exports.getReviews = async (req, res) => {
  const { course_id } = req.body;

  try {
    // Query to fetch reviews with user names
    const reviewQuery = `
      SELECT 
        cr.review_id,
        cr.rating,
        cr.review,
        cr.created_at,
        u.name AS user_name
      FROM CourseReviews cr
      JOIN users u ON cr.user_id = u.user_id
      WHERE cr.course_id = ?
      ORDER BY cr.created_at DESC
    `;

    const [reviewRows] = await pool.query(reviewQuery, [course_id]);

    if (reviewRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No reviews found for this course.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Course reviews fetched successfully.',
      data: reviewRows,
    });

  } catch (error) {
    console.error('Error fetching course reviews:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching course reviews.',
      error: error.message,
    });
  }
};
