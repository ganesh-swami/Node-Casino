const config = require('../config');
const mongoose = require('mongoose');

const CurrentTableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  tableNumber: {
    type: Number,
    type: String,
    required: true,
    unique: true,
  },
  seatNumber: {
    type: Number,
    type: String,
    default: 5,
    required: true,
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

module.exports = CurrentTable = mongoose.model('currentTable', CurrentTableSchema);
