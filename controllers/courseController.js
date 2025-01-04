const courseModel = require('../models/course');
const multer = require('multer');
const path = require('path');
const db = require('../config/database');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/thumbnails'); // Specify upload directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique file naming
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpg|jpeg/; // Only allow jpg/jpeg files
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Only .jpg files are allowed!'));
  },
}).single('thumbnail');

exports.addCourse = async (req, res) => {
  // Handle file upload
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { title, description, category_id, sub_category, video_url, price } = req.body;
      const { file } = req;

      // Validate request body
      if (!title || !description || !category_id || !sub_category || !video_url || !price || !file) {
        return res.status(400).json({ error: 'All fields, including thumbnail, are required' });
      }

      // Insert the new course into the database
      const courseId = await courseModel.createCourse({
        title,
        description,
        category_id,
        sub_category,
        video_url,
        price,
        thumbnail: file.path, // Save file path
      });

      // Fetch the newly created course
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

    // Sanitize the course data and include the thumbnail_url
    const sanitizedCourses = courses.map(({ video_url, ...rest }) => {
      return {
        ...rest,
        thumbnail_url: `/thumbnails/${rest.thumbnail}` // Assuming `thumbnail` is the filename
      };
    });

    res.status(200).json({
      status: 'success',
      message: 'Courses fetched successfully',
      data: {
        courses: sanitizedCourses
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching courses',
      error: error.message
    });
  }
};


exports.uploadVideo = async (req, res) => {
  console.log(req);
  const { course_id, video_url, description, position } = req.body; // Get the data from the request body

  // Validate the input
  if (!course_id || !video_url || !description || typeof position !== 'number') {
    return res.status(400).json({ message: 'Missing or invalid fields' });
  }

  try {
    // Call the function to insert the video into the database
    const videoId = await courseModel.addVideoToCourse({ course_id, video_url, description, position });

    // Respond with a success message and the ID of the inserted video
    res.status(201).json({
      message: 'Video uploaded successfully',
      videoId: videoId,
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({
      message: 'An error occurred while uploading the video',
      error: error.message,
    });
  }
};