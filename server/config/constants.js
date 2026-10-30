/**
 * UNICORN Protocol Constants & Business Logic Configuration
 * Defined as per UNICORN Project Requirements Summary specification
 */

module.exports = {
  // USD Reference conversion: $1 = 100 INR
  USD_INR_RATE: 100,

  // Daily ROI: 0.45% of invested package capital
  DAILY_ROI_RATE: 0.0045, // 0.45%
  TRADING_DAYS_PER_MONTH: 22,

  // 7 Official Investment Packages
  INVESTMENT_PACKAGES: [
    {
      id: 'starter',
      tier: 1,
      name: 'Starter Package',
      amount: 10000,
      usdValue: 100,
      dailyRoiRate: 0.0045,
      dailyReturn: 45,
      monthlyReturn: 990,
      bonusUnc: 1000, // 10 UNC per $1 USD
      tag: 'Beginner',
      color: '#8A70D6'
    },
    {
      id: 'basic',
      tier: 2,
      name: 'Basic Growth',
      amount: 50000,
      usdValue: 500,
      dailyRoiRate: 0.0045,
      dailyReturn: 225,
      monthlyReturn: 4950,
      bonusUnc: 5000,
      tag: 'Popular',
      color: '#A06BD5'
    },
    {
      id: 'pro',
      tier: 3,
      name: 'Pro Trader',
      amount: 250000,
      usdValue: 2500,
      dailyRoiRate: 0.0045,
      dailyReturn: 1125,
      monthlyReturn: 24750,
      bonusUnc: 25000,
      tag: 'Advanced',
      color: '#B55CA9'
    },
    {
      id: 'premium',
      tier: 4,
      name: 'Premium Wealth',
      amount: 500000,
      usdValue: 5000,
      dailyRoiRate: 0.0045,
      dailyReturn: 2250,
      monthlyReturn: 49500,
      bonusUnc: 50000,
      tag: 'Active Plan',
      color: '#C46DB2'
    },
    {
      id: 'elite',
      tier: 5,
      name: 'Elite Portfolio',
      amount: 1000000,
      usdValue: 10000,
      dailyRoiRate: 0.0045,
      dailyReturn: 4500,
      monthlyReturn: 99000,
      bonusUnc: 100000,
      tag: 'High Yield',
      color: '#D854A8'
    },
    {
      id: 'platinum',
      tier: 6,
      name: 'Platinum Staking',
      amount: 2500000,
      usdValue: 25000,
      dailyRoiRate: 0.0045,
      dailyReturn: 11250,
      monthlyReturn: 247500,
      bonusUnc: 250000,
      tag: 'Institutional',
      color: '#E06BB0'
    },
    {
      id: 'vip',
      tier: 7,
      name: 'VIP Unicorn',
      amount: 5000000,
      usdValue: 50000,
      dailyRoiRate: 0.0045,
      dailyReturn: 22500,
      monthlyReturn: 495000,
      bonusUnc: 500000,
      tag: 'Max Tier',
      color: '#A655D0'
    }
  ],

  // Referral Income (ROI on ROI) - Percentage of the applicable ROI amount
  // Level rules from PDF Section 3:
  REFERRAL_TIERS: [
    { level: 1, minDirects: 2, rate: 0.05, label: 'Level 1' },
    { level: 2, minDirects: 4, rate: 0.02, label: 'Levels 2–5' },
    { level: 3, minDirects: 4, rate: 0.02, label: 'Levels 2–5' },
    { level: 4, minDirects: 4, rate: 0.02, label: 'Levels 2–5' },
    { level: 5, minDirects: 4, rate: 0.02, label: 'Levels 2–5' },
    { level: 6, minDirects: 7, rate: 0.01, label: 'Levels 6–10' },
    { level: 7, minDirects: 7, rate: 0.01, label: 'Levels 6–10' },
    { level: 8, minDirects: 7, rate: 0.01, label: 'Levels 6–10' },
    { level: 9, minDirects: 7, rate: 0.01, label: 'Levels 6–10' },
    { level: 10, minDirects: 7, rate: 0.01, label: 'Levels 6–10' },
    { levelRange: [11, 25], minDirects: 12, rate: 0.0025, label: 'Levels 11–25' },
    { levelRange: [26, 999], minDirects: 15, rate: 0.00125, label: 'Level 25+' }
  ],

  // Rank Reward Bonus (One-Time) - PDF Section 4
  // Target includes personal + team business
  RANK_REWARDS: [
    { target: 250000, bonus: 5000, rankName: 'Bronze Leader' },
    { target: 500000, bonus: 11000, rankName: 'Silver Star' },
    { target: 1000000, bonus: 20000, rankName: 'Gold Executive' },
    { target: 2500000, bonus: 45000, rankName: 'Diamond Director' },
    { target: 5000000, bonus: 100000, rankName: 'Crown Ambassador' },
    { target: 10000000, bonusRate: 0.03, fixedBonus: 300000, rankName: 'Unicorn Legend' } // 3% of 1 Crore = 3,00,000
  ],

  // Achiever Bonus - Direct-referred business within 4 months (PDF Section 5)
  ACHIEVER_TRIPS: [
    { target: 500000, reward: 'Goa Trip', durationDays: 3, badge: '🌴 Goa' },
    { target: 1500000, reward: 'Andaman Trip', durationDays: 4, badge: '🏝️ Andaman' },
    { target: 3000000, reward: 'Thailand Trip', durationDays: 5, badge: '✈️ Thailand' },
    { target: 5000000, reward: 'Dubai Trip', durationDays: 5, badge: '🏙️ Dubai' },
    { target: 10000000, reward: 'Europe Trip', durationDays: 7, badge: '🏰 Europe' }
  ],

  // Token Spec - PDF Section 7
  TOKEN_SPEC: {
    name: 'Unicorn',
    symbol: 'UNC',
    network: 'BNB Smart Chain (BEP-20)',
    totalSupply: 100000000, // 100M
    contractAddress: '0x86ff73998b5A4dE1E90bEb8415F1560B05efF377'
  }
};

