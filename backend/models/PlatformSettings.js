const mongoose = require('mongoose');

/**
 * PlatformSettings Schema
 * Centralized, admin-editable configuration repository for all platform financial
 * and reward parameters. All ambiguous/unresolved rules are managed here.
 */
const platformSettingsSchema = new mongoose.Schema({
  // Singleton identifier
  isCurrent: {
    type: Boolean,
    default: true,
    unique: true
  },

  // 1. Daily ROI Parameters (Section 11)
  // CONFIGURABLE / TODO: Final duration and compounding rules must be confirmed by business
  dailyRoiRate: {
    type: Number,
    default: 0.0045, // 0.45% per day
    min: [0, 'Daily ROI cannot be negative'],
    max: [0.10, 'Daily ROI cannot exceed 10%']
  },
  minWithdrawal: {
    type: Number,
    default: 500
  },
  usdToInrRate: {
    type: Number,
    default: 100
  },
  roiCalculationBase: {
    type: String,
    enum: ['PACKAGE_PRINCIPAL', 'CURRENT_ACTIVE_CAPITAL'],
    default: 'PACKAGE_PRINCIPAL'
  },
  roiDurationDays: {
    type: Number,
    default: 365,
    min: [1, 'Duration must be at least 1 day']
  },
  roiCompoundingRule: {
    type: String,
    enum: ['SIMPLE', 'DAILY_COMPOUND'],
    default: 'SIMPLE' // Default: Simple interest, no daily compounding
  },
  weekendPauseEnabled: {
    type: Boolean,
    default: true // Monday to Friday active (22 trading days/month)
  },

  // 2. Multi-Level Referral Configuration (ROI-on-ROI) (Section 10)
  // Resolves overlapping boundaries: [1], [2-5], [6-10], [11-25], [26+]
  referralLevelConfig: [
    {
      level: { type: Number },
      startLevel: { type: Number },
      endLevel: { type: Number },
      rate: { type: Number, required: true },
      minDirects: { type: Number, required: true },
      description: { type: String }
    }
  ],

  // 3. Rank Reward Configuration (One-Time) (Section 12)
  rankRewardConfig: [
    {
      rankTargetINR: { type: Number, required: true },
      bonusAmount: { type: Number, required: true },
      bonusPercentage: { type: Number, default: null },
      calculationBase: { type: String, default: 'TOTAL_BUSINESS' },
      rankName: { type: String, required: true }
    }
  ],

  // 4. Achiever Bonus Configuration (Within 4 Months)
  achieverBonusConfig: [
    {
      targetINR: { type: Number, required: true },
      rewardDescription: { type: String, required: true },
      qualificationWindowMonths: { type: Number, default: 4 }
    }
  ],

  // 5. Withdrawal Rules (Section 9)
  withdrawalRules: {
    minWithdrawalINR: { type: Number, default: 500 },
    maxDailyWithdrawalINR: { type: Number, default: 500000 },
    withdrawalFeePercent: { type: Number, default: 5 }, // 5% admin/compliance fee
    require2FA: { type: Boolean, default: true } // 2FA required strictly only at withdrawal
  },

  // 6. Deposit Rules (Section 8)
  depositRules: {
    minDepositINR: { type: Number, default: 100 },
    fixedUsdInrRate: { type: Number, default: 100 }, // $1 = 100 INR
    allowedCurrencies: [{ type: String, default: ['INR', 'USDT', 'UNC'] }]
  },

  // 7. Web3 & Smart Contract Configuration
  web3Config: {
    network: { type: String, default: 'bsc_testnet' },
    chainId: { type: Number, default: 97 },
    rpcUrl: { type: String, default: 'https://data-seed-prebsc-1-s1.binance.org:8545/' },
    uncTokenAddress: { type: String, default: '0x82f9A1498C71e84C21a50B2026BEP20UNC' },
    usdtTokenAddress: { type: String, default: '0x337610d27c682E347C9cD60BE4B3b107C9d34dDd' }
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.PlatformSettings || mongoose.model('PlatformSettings', platformSettingsSchema);

