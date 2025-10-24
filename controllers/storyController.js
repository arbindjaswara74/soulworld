const Story = require('../models/Story');
const { body, validationResult } = require('express-validator');

// Add this middleware before your handler
exports.validateStory = [
  body('title').isLength({ min: 3 }).withMessage('Title too short'),
  body('content').isLength({ min: 10 }).withMessage('Content too short'),
  body('section').optional().isIn(['leaf','lotus']).withMessage('Invalid section'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
];

// POST /api/stories
exports.createStory = async (req, res, next) => {
  try {
    const { title, content, authorName, tags } = req.body;
      const section = req.body.section || 'leaf';
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
  const story = new Story({ title, content, authorName, tags, section });
    await story.save();
    res.status(201).json(story);
  } catch (err) {
    next(err);
  }
};

// GET /api/stories
exports.getStories = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.section && ['leaf','lotus'].includes(req.query.section)) filter.section = req.query.section;
    const stories = await Story.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json(stories);
  } catch (err) {
    next(err);
  }
};

// GET /api/stories/:id
exports.getStoryById = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    res.json(story);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/stories/:id
exports.deleteStory = async (req, res, next) => {
  try {
    const deleted = await Story.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Story not found' });
    res.json({ message: 'Story deleted' });
  } catch (err) {
    next(err);
  }
};
