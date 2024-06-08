const config = require('../config');
const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  tableId: {
    type: String,
  },
  playerId: {
    type: String,
  },
  action: {
    type: String,
    required: true,
  },
  actionData: {
    type: String,
  },
  message: {
    type: String,
  },
  tableData: {
    type: String,
  }
}, {
  timestamps: true,
  toJSON: { 
      virtuals: true,
  },
  toObject: {
      virtuals: true
  }
})

module.exports = Log = mongoose.model('logs', LogSchema);
