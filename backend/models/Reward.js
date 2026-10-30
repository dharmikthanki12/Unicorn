const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['rank_bonus', 'achiever_trip'],
    required: true
  },
  rewardName: {
    type: String,
    required: true
  },
  targetVolume: {
    type: Number,
    required: true
  },
  bonusAmount: {
    type: Number,
    default: 0
  },
  rankName: {
    type: String,
    default: function() { return this.rewardName; }
  },
  targetINR: {
    type: Number,
    default: function() { return this.targetVolume; }
  },
  bonusINR: {
    type: Number,
    default: function() { return this.bonusAmount; }
  },
  bonusPercentage: {
    type: Number,
    default: null
  },
  achievedAt: {
    type: Date,
    default: Date.now
  },
  disbursedAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['unlocked', 'claimed', 'disbursed', 'UNLOCKED', 'CLAIMED', 'DISBURSED'],
    default: 'unlocked'
  },
  claimedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Reward || mongoose.model('Reward', rewardSchema);

