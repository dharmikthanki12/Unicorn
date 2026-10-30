const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Deposit amount is required'],
    min: [100, 'Minimum deposit is ₹100']
  },
  currency: {
    type: String,
    enum: ['INR', 'USD', 'USDT'],
    default: 'INR'
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'USDT (BEP-20)', 'BANK_TRANSFER'],
    required: true
  },
  transactionReference: {
    type: String,
    required: [true, 'Transaction reference/UTR number is required'],
    trim: true,
    index: true
  },
  blockchainTxHash: {
    type: String,
    trim: true,
    default: ''
  },
  amountINR: {
    type: Number,
    default: function() { return this.amount; }
  },
  amountCrypto: {
    type: Number,
    default: 0
  },
  network: {
    type: String,
    default: 'BSC'
  },
  txHash: {
    type: String,
    default: function() { return this.blockchainTxHash || ''; }
  },
  method: {
    type: String,
    default: function() { return this.paymentMethod; }
  },
  adminRemark: {
    type: String,
    default: function() { return this.reviewNotes || this.rejectionReason || ''; }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'PENDING', 'APPROVED', 'REJECTED'],
    default: 'pending',
    index: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectionReason: {
    type: String,
    default: function() { return this.reviewNotes || ''; }
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewNotes: {
    type: String,
    default: ''
  },
  reviewedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Deposit || mongoose.model('Deposit', depositSchema);

