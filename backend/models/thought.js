const mongoose = require('mongoose');

const ThoughtSchema = new mongoose.Schema({
  content: { type: String, required: true, maxlength: 1000 },
  authorName: { type: String, default: 'Anonymous' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Thought', ThoughtSchema);
