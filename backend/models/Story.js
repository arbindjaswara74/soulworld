const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, required: true },
  authorName: { type: String, default: 'Anonymous' },
  createdAt: { type: Date, default: Date.now },
  tags: [String],
  flagged: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Story', StorySchema);
