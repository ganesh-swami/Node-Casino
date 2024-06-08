const config = require('../config');
const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  socketId: {
    type: String,
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  bankroll: {
    type: Number,
  },
  active: {
    type: Boolean,
    required: true,
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

module.exports = Player = mongoose.model('players', PlayerSchema);
