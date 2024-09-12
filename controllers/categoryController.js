const categoryModel = require('../models/category');

exports.addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate request body
    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    // Insert the new category into the database
    const categoryId = await categoryModel.createCategory({ name, description });

    // Fetch the newly created category
    const newCategory = await categoryModel.getCategoryById(categoryId);

    res.status(201).json(newCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await categoryModel.getAllCategories();
    res.status(200).json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
