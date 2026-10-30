const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  walletType: {
    type: String,
    enum: ['main', 'roi', 'referral', 'unc'],
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'invest', 'roi_credit', 'referral_bonus', 'rank_reward', 'transfer', 'refund'],
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  amountFormatted: {
    type: String,
    required: true
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
