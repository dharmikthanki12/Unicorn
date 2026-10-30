const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    default: null
  },
  walletType: {
    type: String,
    enum: ['main', 'roi', 'referral', 'unc', 'MAIN', 'REFERRAL'],
    required: true
  },
  type: {
    type: String,
    enum: [
      'deposit', 'withdrawal', 'invest', 'roi_credit', 'referral_bonus', 'rank_reward', 'transfer', 'refund',
      'DEPOSIT', 'WITHDRAWAL', 'INVEST', 'ROI', 'REFERRAL', 'RANK_REWARD', 'TRANSFER', 'REFUND'
    ],
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  amountINR: {
    type: Number,
    default: function() { return this.amount; }
  },
  amountUNC: {
    type: Number,
    default: 0
  },
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  amountFormatted: {
    type: String,
    default: function() { return `₹${this.amount ? this.amount.toLocaleString('en-IN') : 0}`; }
  },
  entryType: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  balanceBefore: {
    type: Number,
    default: 0
  },
  balanceAfter: {
    type: Number,
    default: 0
  },
  referenceId: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'rejected', 'failed'],
    default: 'completed'
  },
  txHash: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

