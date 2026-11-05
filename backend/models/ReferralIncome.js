const mongoose = require('mongoose');

const referralIncomeSchema = new mongoose.Schema({
  sponsorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  investmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investment',
    default: null
  },
  level: {
    type: Number,
    required: true,
    min: 1
  },
  roiBaseAmount: {
    type: Number,
    required: true,
    min: 0
  },
  commissionRate: {
    type: Number,
    required: true,
    min: 0
  },
  amountINR: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['CREDITED', 'PENDING', 'CANCELLED'],
    default: 'CREDITED'
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.ReferralIncome || mongoose.model('ReferralIncome', referralIncomeSchema);

