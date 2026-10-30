const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  packageId: {
    type: String,
    required: true
  },
  packageName: {
    type: String,
    required: true
  },
  tier: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount must be positive']
  },
  dailyRoiRate: {
    type: Number,
    default: 0.0045 // 0.45%
  },
  dailyRoiAmount: {
    type: Number,
    required: true
  },
  bonusUnc: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'cancelled'],
    default: 'confirmed'
  },
  paymentMethod: {
    type: String,
    enum: ['main_wallet', 'usdt_bep20', 'upi'],
    default: 'main_wallet'
  },
  transactionReference: {
    type: String,
    default: ''
  },
  blockchainTxHash: {
    type: String,
    default: ''
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  lastRoiCalculationDate: {
    type: Date,
    default: null
  },
  daysCredited: {
    type: Number,
    default: 0
  },
  totalRoiEarned: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Investment || mongoose.model('Investment', investmentSchema);
