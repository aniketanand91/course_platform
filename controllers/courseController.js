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

exports.uploadVideo = [
  uploadVideo.single('video'),
  async (req, res) => {
    const { course_id, description, position } = req.body;
    const file = req.file;

    if (!course_id || !description || typeof Number(position) !== 'number' || !file) {
      return res.status(400).json({ message: 'Missing or invalid fields' });
    }

    try {
      const s3Params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `courses/${course_id}/${Date.now()}_${file.originalname}`, // ✅ wrapped in backticks
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      };

      const s3Data = await s3.upload(s3Params).promise();
      const video_url = s3Data.Location;

      const videoId = await courseModel.addVideoToCourse({
        course_id,
        video_url,
        description,
        position: Number(position),
      });

      res.status(201).json({
        message: 'Video uploaded successfully',
        videoId,
        video_url,
      });
    } catch (error) {
      console.error('Error uploading video:', error);
      res.status(500).json({
        message: 'An error occurred while uploading the video',
        error: error.message,
      });
    }
  },
];


exports.submitProject = async (req, res) => {
  try {
    const { user_id, link } = req.body;

    // Validate input
    if (!user_id || !link) {
      return res.status(400).json({ error: 'User ID and link are required' });
    }

    // Insert the submission into the database
    const query = `
      INSERT INTO ProjectSubmissions (user_id, submission_link, submitted_at) 
      VALUES (?, ?, NOW())
    `;
    const values = [user_id, link];
    await db.query(query, values);

    res.status(201).json({ message: 'Project submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error while submitting the project' });
  }
};
