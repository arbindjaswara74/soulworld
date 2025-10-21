const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const { 
  createStory,
  getStories,
  getStoryById,
  deleteStory,
  validateStory
} = require('../controllers/storyController');

// Route to create a story (with validation)
router.route('/')
  .post(validateStory, createStory)  // validate before creating
  .get(getStories);                  // get all stories

// Route to get or delete a story by ID
router.route('/:id')
  .get(getStoryById)
  .delete(adminAuth, deleteStory);   // only admin can delete

module.exports = router;
