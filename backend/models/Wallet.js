const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // 3 Wallets per User: MAIN, REFERRAL, ROI
  type: {
    type: String,
    enum: ['MAIN', 'REFERRAL', 'ROI', 'main', 'referral', 'roi'],
    required: true
  },
  // Available ledger balance
  balance: {
    type: Number,
    default: 0,
    min: [0, 'Balance cannot be negative']
  },
  // Reserved amount during pending withdrawal (prevents double-spending)
  reservedWithdrawal: {
    type: Number,
    default: 0,
    min: [0, 'Reserved balance cannot be negative']
  },
  // Bonus Unicorn (UNC) BEP-20 Tokens
  balanceUNC: {
    type: Number,
    default: 0,
    min: [0, 'UNC balance cannot be negative']
  },
  // Compatibility fields & aliases
  balanceINR: {
    type: Number,
    default: 0
  },
  lockedBalance: {
    type: Number,
    default: 0
  },
  mainBalance: {
    type: Number,
    default: 0
  },
  roiBalance: {
    type: Number,
    default: 0
  },
  referralBalance: {
    type: Number,
    default: 0
  },
  uncBalance: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for available balance
walletSchema.virtual('availableBalance').get(function() {
  return Math.max(0, this.balance - (this.reservedWithdrawal || 0));
});

// Unique compound index on (userId, type) strictly enforced
walletSchema.index({ userId: 1, type: 1 }, { unique: true });

module.exports = mongoose.models.Wallet || mongoose.model('Wallet', walletSchema);
