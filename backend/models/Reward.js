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
  status: {
    type: String,
    enum: ['unlocked', 'claimed', 'disbursed'],
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
