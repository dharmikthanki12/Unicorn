const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Withdrawal amount is required'],
    min: [500, 'Minimum withdrawal is ₹500']
  },
  walletSource: {
    type: String,
    enum: ['roi', 'referral'],
    required: true
  },
  payoutMethod: {
    type: String,
    enum: ['crypto', 'bank', 'upi'],
    required: true
  },
  destinationAddress: {
    type: String,
    required: [true, 'Payout destination address or account is required'],
    trim: true
  },
  network: {
    type: String,
    default: 'BNB Smart Chain (BEP-20)'
  },
  feeAmount: {
    type: Number,
    default: 0
  },
  netAmount: {
    type: Number,
    required: true
  },
  walletType: {
    type: String,
    enum: ['roi', 'referral', 'MAIN', 'REFERRAL', 'ROI', 'main'],
    default: function() { return this.walletSource || 'roi'; }
  },
  amountINR: {
    type: Number,
    default: function() { return this.amount; }
  },
  feeINR: {
    type: Number,
    default: function() { return this.feeAmount || 0; }
  },
  netAmountINR: {
    type: Number,
    default: function() { return this.netAmount; }
  },
  destination: {
    type: String,
    default: function() { return this.destinationAddress; }
  },
  is2faVerified: {
    type: Boolean,
    default: function() { return this.twoFactorVerified; }
  },
  adminRemark: {
    type: String,
    default: function() { return this.adminNotes || ''; }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid', 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'PAID'],
    default: 'pending',
    index: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: function() { return this.reviewedBy; }
  },
  rejectionReason: {
    type: String,
    default: function() { return this.adminNotes || ''; }
  },
  txHash: {
    type: String,
    default: ''
  },
  twoFactorVerified: {
    type: Boolean,
    default: false
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  adminNotes: {
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

module.exports = mongoose.models.Withdrawal || mongoose.model('Withdrawal', withdrawalSchema);

