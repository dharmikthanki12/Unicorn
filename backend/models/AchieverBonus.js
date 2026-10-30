const mongoose = require('mongoose');

const achieverBonusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  targetINR: {
    type: Number,
    required: true
  },
  rewardName: {
    type: String,
    required: true
  },
  directVolumeINR: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['QUALIFIED', 'CLAIMED', 'DISBURSED'],
    default: 'QUALIFIED'
  },
  qualificationDate: {
    type: Date,
    default: Date.now
  },
  claimedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.AchieverBonus || mongoose.model('AchieverBonus', achieverBonusSchema);

