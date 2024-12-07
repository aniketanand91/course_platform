const courseModel = require('../models/course');

exports.addCourse = async (req, res) => {
  try {
    const { title, description, category_id, sub_category, video_url, price } = req.body;

    // Validate request body
    if (!title || !description || !category_id || !sub_category || !video_url || !price) {
      return res.status(400).json({ error: 'All fields are required, including price' });
    }

    // Insert the new course into the database
    const courseId = await courseModel.createCourse({ title, description, category_id, sub_category, video_url, price });

    // Fetch the newly created course
    const newCourse = await courseModel.getCourseById(courseId);

    res.status(201).json(newCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};


exports.getCourse = async (req, res) => {
  try {
    const courses = await courseModel.getCourse();

    // Remove the video_url from each course object
    const sanitizedCourses = courses.map(({ video_url, ...rest }) => rest);

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

