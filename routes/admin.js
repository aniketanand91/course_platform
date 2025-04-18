const express = require('express');
const router = express.Router();
const checkAdmin = require('../middleware/checkAdmin');
const courseController = require('../controllers/courseController');
const categoryController = require('../controllers/categoryController');

// POST /admin/categories - Add a new category (admin only)
router.post('/categories', checkAdmin, categoryController.addCategory);

// GET /admin/categories - Get all categories (admin only)
router.get('/categories',  categoryController.getAllCategories);


router.get('/courses',   courseController.getCourse);
// POST /admin/courses - Add a new course (admin only)
router.post('/courses',  checkAdmin, courseController.addCourse);

router.post('/multiplecourse', checkAdmin, courseController.uploadVideo)

module.exports = router;
