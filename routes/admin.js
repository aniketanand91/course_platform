const express = require('express');
const router = express.Router();
const checkAdmin = require('../middleware/checkAdmin');
const courseController = require('../controllers/courseController');
const categoryController = require('../controllers/categoryController');

// POST /admin/categories - Add a new category (admin only)
router.post('/categories', checkAdmin, categoryController.addCategory);

// GET /admin/categories - Get all categories (admin only)
router.get('/categories',  checkAdmin, categoryController.getAllCategories);

// POST /admin/courses - Add a new course (admin only)
router.post('/courses',  checkAdmin, courseController.addCourse);

module.exports = router;
