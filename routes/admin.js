const express = require('express');
const router = express.Router();
const checkAdmin = require('../middleware/checkAdmin');
const courseController = require('../controllers/courseController');
const categoryController = require('../controllers/categoryController');
const adminController = require('../controllers/adminController');

// POST /admin/categories - Add a new category (admin only)
router.post('/categories', checkAdmin, categoryController.addCategory);

// GET /admin/categories - Get all categories (admin only)
router.get('/categories',  categoryController.getAllCategories);


router.get('/courses',   courseController.getCourse);
router.post('/admin/courses/upload',   courseController.adminGetCourse);
// POST /admin/courses - Add a new course (admin only)
router.post('/courses',  checkAdmin, courseController.addCourse);

router.post('/multiplecourse',  courseController.uploadVideo)

router.post('/approve-course',checkAdmin, adminController.approveCourse);
router.get('/admin/courses', checkAdmin,adminController.getAllCoursesWithUser);

router.get('/getProjectDetails', checkAdmin,adminController.getAllProjectSubmissions);
router.post('/approve-reject', checkAdmin,adminController.approveProjectSubmitted);

router.post('/getPresignedURL', checkAdmin, courseController.generatePresignedUrl);

module.exports = router;
