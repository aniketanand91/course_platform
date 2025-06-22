const courseModel = require('../models/course');
const multer = require('multer');
const path = require('path');
const db = require('../config/database');
const memoryStorage = multer.memoryStorage();
const uploadVideo = multer({ storage: memoryStorage });
const AWS = require('aws-sdk');
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET_NAME } = process.env;

AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

const s3 = new AWS.S3();

// For thumbnail uploads to local disk
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/thumbnails');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // ✅ wrapped in backticks
  },
});

const upload = multer({
  storage: diskStorage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpg|jpeg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Only .jpg files are allowed!'));
  },
}).single('thumbnail');

exports.addCourse = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      // const user_id = req.user.userId;
      const { title, description, category_id, sub_category, video_url, price, user_id } = req.body;
      const { file } = req;

      console.log(user_id);
      if (!user_id) {
        return res.status(401).json({ error: 'Unauthorized: Missing user ID' });
      }

      if (!title || !description || !category_id || !sub_category || !video_url || !price || !file) {
        return res.status(400).json({ error: 'All fields, including thumbnail, are required' });
      }

      const courseId = await courseModel.createCourse({
        title,
        description,
        category_id,
        sub_category,
        video_url,
        price,
        thumbnail: file.path,
        user_id,
      });

      const newCourse = await courseModel.getCourseById(courseId);

      res.status(201).json(newCourse);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });
};

exports.getCourse = async (req, res) => {
  try {
    const courses = await courseModel.getCourse();

    const sanitizedCourses = courses.map(({ video_url, ...rest }) => {
      return {
        ...rest,
        thumbnail_url: `thumbnails/${rest.thumbnail}`, // ✅ wrapped in backticks
      };
    });

    res.status(200).json({
      status: 'success',
      message: 'Courses fetched successfully',
      data: {
        courses: sanitizedCourses,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching courses',
      error: error.message,
    });
  }
};

exports.adminGetCourse = async (req, res) => {
  try {
    const { userId } = req.body; // 👈 FIXED: match the casing
    const courses = await courseModel.getCourseForAdmin(Number(userId)); // cast to number for safety

    const sanitizedCourses = courses.map(({ video_url, ...rest }) => {
      return {
        ...rest,
        thumbnail_url: `thumbnails/${rest.thumbnail}`,
      };
    });

    res.status(200).json({
      status: 'success',
      message: 'Courses fetched successfully',
      data: {
        courses: sanitizedCourses,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching courses',
      error: error.message,
    });
  }
};

exports.uploadVideo = async (req, res) => {
  const { course_id, description, position, fileUrl } = req.body;

  if (!course_id || !description || typeof Number(position) !== 'number' || !fileUrl) {
    return res.status(400).json({ message: 'Missing or invalid fields' });
  }

  try {
    const videoId = await courseModel.addVideoToCourse({
      course_id,
      video_url: fileUrl, // ✅ Use the fileUrl provided from frontend (pre-signed S3 URL)
      description,
      position: Number(position),
    });

    res.status(201).json({
      message: 'Video uploaded successfully',
      videoId,
      video_url: fileUrl,
    });
  } catch (error) {
    console.error('Error inserting video record:', error);
    res.status(500).json({
      message: 'An error occurred while saving the video record',
      error: error.message,
    });
  }
};



exports.submitProject = async (req, res) => {
  try {
    const { user_id, link, course_id } = req.body;

    // Validate input
    if (!user_id || !link) {
      return res.status(400).json({ error: 'User ID and link are required' });
    }

    // Insert the submission into the database
    const query = `
      INSERT INTO ProjectSubmissions (user_id, submission_link, course_id, submitted_at) 
      VALUES (?, ?, ?, NOW())
    `;
    const values = [user_id, link, course_id];
    await db.query(query, values);

    res.status(201).json({ message: 'Project submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error while submitting the project' });
  }
};


exports.projectStatus = async (req, res) => {
  const { course_id, user_id } = req.body;

  const query = `
    SELECT * FROM ProjectSubmissions
    WHERE course_id = ? AND user_id = ?`;

  const values = [course_id, user_id];

  try {
    const [rows] = await db.query(query, values);
    res.status(200).json(rows); // Send the result back to the client
  } catch (error) {
    console.error('Error fetching project status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};




exports.courseReview = async (req, res) => {
  const { user_id, course_id, rating, review } = req.body;

  if (!user_id || !course_id || !rating || !review) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const query = `
      INSERT INTO CourseReviews (user_id, course_id, rating, review, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;

    // Assuming you're using a MySQL connection pool named "db"
    await db.query(query, [user_id, course_id, rating, review]);

    res.status(201).json({ message: "Review submitted successfully." });
  } catch (error) {
    console.error("Error inserting review:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



exports.generatePresignedUrl = async (req, res) => {
  const { fileName, fileType, course_id } = req.body;
  console.log(fileName, fileType, course_id);
  if (!fileName || !fileType || !course_id) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const s3Params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `courses/${course_id}/${Date.now()}_${fileName}`,
    Expires: 60 * 15, // URL valid for 15 minutes
    ContentType: 'mp4',
    ACL: 'public-read',
  };

  try {
    const uploadURL = await s3.getSignedUrlPromise('putObject', s3Params);
    return res.json({ uploadURL, fileKey: s3Params.Key });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ message: 'Error generating presigned URL' });
  }
};