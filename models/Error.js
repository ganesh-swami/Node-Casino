const config = require('../config');
const mongoose = require('mongoose');

const ErrorSchema = new mongoose.Schema({
  error: {
    type: String,
  },
}, {
  timestamps: true,
  toJSON: { 
      virtuals: true,
  },
  toObject: {
      virtuals: true
  }
})

module.exports = Error = mongoose.model('errors', ErrorSchema);
