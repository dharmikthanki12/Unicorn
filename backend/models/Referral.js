const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  sponsorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  downlineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  level: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  activeInvestmentVolume: {
    type: Number,
    default: 0
  },
  totalCommissionsEarned: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

referralSchema.index({ sponsorId: 1, downlineId: 1 }, { unique: true });

module.exports = mongoose.models.Referral || mongoose.model('Referral', referralSchema);

