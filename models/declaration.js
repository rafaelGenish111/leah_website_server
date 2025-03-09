const mongoose = require('mongoose');

const DeclarationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  idNumber: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  healthConditions: {
    heartProblems: { type: Boolean, default: false },
    highBloodPressure: { type: Boolean, default: false },
    diabetes: { type: Boolean, default: false },
    pregnancy: { type: Boolean, default: false },
    recentSurgery: { type: Boolean, default: false },
    skinConditions: { type: Boolean, default: false },
    allergies: { type: Boolean, default: false },
    other: { type: String }
  },
  confirmTruth: {
    type: Boolean,
    required: true
  },
  signature: {
    type: String,  // Store signature as base64 string
    required: true
  }
});

module.exports = mongoose.model('Declaration', DeclarationSchema);