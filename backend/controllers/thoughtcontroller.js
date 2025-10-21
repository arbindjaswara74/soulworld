const Thought = require('../models/Thought');

// POST /api/thoughts
exports.createThought = async (req, res, next) => {
  try {
    const { content, authorName } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });
    const thought = new Thought({ content, authorName });
    await thought.save();
    res.status(201).json(thought);
  } catch (err) {
    next(err);
  }
};

// GET /api/thoughts
exports.getThoughts = async (req, res, next) => {
  try {
    const thoughts = await Thought.find().sort({ createdAt: -1 }).limit(200);
    res.json(thoughts);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/thoughts/:id
exports.deleteThought = async (req, res, next) => {
  try {
    const t = await Thought.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Thought not found' });
    await t.remove();
    res.json({ message: 'Thought deleted' });
  } catch (err) {
    next(err);
  }
};
