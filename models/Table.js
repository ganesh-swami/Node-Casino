const config = require('../config');
const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  tableId: {
    type: String,
    required: true,
    unique: true,
  },
  tableName: {
    type: String,
  },
  limit: {
    type: Number,
    required: true,
  },
  seat: {
    type: Number,
    required: true,
  },
  data: {
    type: String,
    required: true,
    unique: true,
  },
  active: {
    type: Boolean,
    require: true,
    default: true,
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

module.exports = Table = mongoose.model('tables', TableSchema);
