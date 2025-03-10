const mongoose = require('mongoose');

const GalleryImageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'general'
  },
  order: {
    type: Number,
    default: 0
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

module.exports = mongoose.model('GalleryImage', GalleryImageSchema);