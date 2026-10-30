const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  // Main Deposit Wallet (Ready to invest)
  mainBalance: {
    type: Number,
    default: 0,
    min: [0, 'Main Wallet balance cannot be negative']
  },
  // Daily ROI Earnings Wallet
  roiBalance: {
    type: Number,
    default: 0,
    min: [0, 'ROI Wallet balance cannot be negative']
  },
  // Referral & Commission Wallet
  referralBalance: {
    type: Number,
    default: 0,
    min: [0, 'Referral Wallet balance cannot be negative']
  },
  // Unicorn (UNC) BEP-20 Bonus Token Balance
  uncBalance: {
    type: Number,
    default: 0,
    min: [0, 'UNC balance cannot be negative']
  },
  // Reserved amount during pending withdrawal (prevents double spending)
  reservedWithdrawal: {
    type: Number,
    default: 0,
    min: [0, 'Reserved balance cannot be negative']
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Wallet || mongoose.model('Wallet', walletSchema);
