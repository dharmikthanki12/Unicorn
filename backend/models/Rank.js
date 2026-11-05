const mongoose = require('mongoose');

const rankSchema = new mongoose.Schema({
  targetVolume: {
    type: Number,
    required: true,
    unique: true
  },
  rankName: {
    type: String,
    required: true
  },
  oneTimeBonus: {
    type: Number,
    required: true
  },
  bonusPercentage: {
    type: Number,
    default: null
  },
  badge: {
    type: String,
    default: '🎖️'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Rank || mongoose.model('Rank', rankSchema);

