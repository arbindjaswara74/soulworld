const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, required: true },
  authorName: { type: String, default: 'Anonymous' },
  // section indicates which library the story belongs to
  section: { type: String, enum: ['leaf', 'lotus'], default: 'leaf' },
  createdAt: { type: Date, default: Date.now },
  tags: [String],
  flagged: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Story', StorySchema);
