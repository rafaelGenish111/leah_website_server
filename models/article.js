const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  author: {
    type: String,
    default: 'ליאה גניש'
  },
  date: {
    type: Date,
    default: Date.now
  },
  published: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('Article', ArticleSchema);
