// Unicorn Web3 Platform Data & Business Logic Constants
// Based on UNICORN_Project_Requirements_Summary.pdf & Unicorn Mobile App Designs

export const INITIAL_USER = {
  id: 'UNC-88294',
  name: 'Rutajeet Mukherjee',
  initials: 'RM',
  email: 'rutajeet@unicorn.io',
  phone: '+91 98765 43210',
  rank: 'Gold Unicorn',
  kycStatus: 'VERIFIED', // 'VERIFIED' | 'PENDING' | 'UNVERIFIED'
  twoFactorEnabled: true,
  twoFactorSecret: 'UNICORN-2FA-SEC-88294',
  web3Connected: true,
  web3Address: '0x71C5A869d2319fBc9057bA27218Ac9bB38A9',
  referralCode: 'UNC88294',
  referralLink: 'https://unicorn.io/join?ref=UNC88294',
  sponsor: 'UNC-70012 (Arjun K.)',
  
  // Wallet Balances in INR
  mainWalletBalance: 150000,    // Ready to invest
  roiWalletBalance: 54000,      // Daily ROI earnings
  referralWalletBalance: 38750, // Commissions & bonuses
  
  // Stats
  activeInvestedAmount: 500000, // Premium Wealth package
  todayRoiIncome: 2250,
  todayReferralIncome: 1125,
  directBusiness: 1250000,      // For Achiever Bonus
  teamBusiness: 8500000,        // For Rank Reward Bonus
  totalDirects: 4,              // Number of direct active referrals
  joinedDate: '12 Sep 2026',
};

// Investment Packages from PDF Section 2 & template
export const INVESTMENT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Package',
    tier: 1,
    amount: 10000,
    usdValue: 100,
    dailyRoiRate: 0.0045, // 0.45%
    dailyReturn: 45,
    dailyRoi: 45,
    monthlyReturn: 990,   // ~22 trading/active days
    monthlyRoi: 990,
    bonusUnc: 1000,
    tag: 'Beginner',
    color: '#8A70D6'
  },
  {
    id: 'basic',
    name: 'Basic Growth',
    tier: 2,
    amount: 50000,
    usdValue: 500,
    dailyRoiRate: 0.0045,
    dailyReturn: 225,
    dailyRoi: 225,
    monthlyReturn: 4950,
    monthlyRoi: 4950,
    bonusUnc: 5000,
    tag: 'Popular',
    color: '#A06BD5'
  },
  {
    id: 'pro',
    name: 'Pro Trader',
    tier: 3,
    amount: 250000,
    usdValue: 2500,
    dailyRoiRate: 0.0045,
    dailyReturn: 1125,
    dailyRoi: 1125,
    monthlyReturn: 24750,
    monthlyRoi: 24750,
    bonusUnc: 25000,
    tag: 'Advanced',
    color: '#B55CA9'
  },
  {
    id: 'premium',
    name: 'Premium Wealth',
    tier: 4,
    amount: 500000,
    usdValue: 5000,
    dailyRoiRate: 0.0045,
    dailyReturn: 2250,
    dailyRoi: 2250,
    monthlyReturn: 49500,
    monthlyRoi: 49500,
    bonusUnc: 50000,
    tag: 'Active Plan',
    color: '#C46DB2'
  },
  {
    id: 'elite',
    name: 'Elite Portfolio',
    tier: 5,
    amount: 1000000,
    usdValue: 10000,
    dailyRoiRate: 0.0045,
    dailyReturn: 4500,
    dailyRoi: 4500,
    monthlyReturn: 99000,
    monthlyRoi: 99000,
    bonusUnc: 100000,
    tag: 'High Yield',
    color: '#CC80B0'
  },
  {
    id: 'diamond',
    name: 'Diamond Whale',
    tier: 6,
    amount: 2500000,
    usdValue: 25000,
    dailyRoiRate: 0.0045,
    dailyReturn: 11250,
    dailyRoi: 11250,
    monthlyReturn: 247500,
    monthlyRoi: 247500,
    bonusUnc: 250000,
    tag: 'VIP Club',
    color: '#D495BD'
  },
  {
    id: 'crown',
    name: 'Crown Unicorn',
    tier: 7,
    amount: 5000000,
    usdValue: 50000,
    dailyRoiRate: 0.0045,
    dailyReturn: 22500,
    dailyRoi: 22500,
    monthlyReturn: 495000,
    monthlyRoi: 495000,
    bonusUnc: 500000,
    tag: 'Legendary',
    color: '#DDAAC9'
  }
];

// Referral Commission Levels (PDF Section 3: ROI on ROI)
export const REFERRAL_LEVEL_TIERS = [
  { level: 1, label: 'L1', rate: '5%', rateNum: 0.05, minDirects: 2, note: 'Direct referrals' },
  { level: 2, label: 'L2', rate: '2%', rateNum: 0.02, minDirects: 4, note: 'Team generation 2' },
  { level: 3, label: 'L3', rate: '2%', rateNum: 0.02, minDirects: 4, note: 'Team generation 3' },
  { level: 4, label: 'L4', rate: '2%', rateNum: 0.02, minDirects: 4, note: 'Team generation 4' },
  { level: 5, label: 'L5', rate: '2%', rateNum: 0.02, minDirects: 4, note: 'Team generation 5' },
  { level: 6, label: 'L6-10', rate: '1%', rateNum: 0.01, minDirects: 7, note: 'Levels 5–10' },
  { level: 11, label: 'L10-25', rate: '0.25%', rateNum: 0.0025, minDirects: 12, note: 'Levels 10–25' },
  { level: 26, label: 'L25+', rate: '0.125%', rateNum: 0.00125, minDirects: 15, note: 'Level 25 and beyond' }
];

// Rank Reward Bonus (One-time, PDF Section 4)
export const RANK_REWARD_BONUSES = [
  { target: 250000, bonus: 5000, label: '₹2.5 Lakh', bonusLabel: '₹5,000', achieved: true },
  { target: 500000, bonus: 11000, label: '₹5 Lakh', bonusLabel: '₹11,000', achieved: true },
  { target: 1000000, bonus: 20000, label: '₹10 Lakh', bonusLabel: '₹20,000', achieved: true },
  { target: 2500000, bonus: 45000, label: '₹25 Lakh', bonusLabel: '₹45,000', achieved: true },
  { target: 5000000, bonus: 100000, label: '₹50 Lakh', bonusLabel: '₹1,00,000', achieved: true },
  { target: 10000000, bonus: 300000, label: '₹1 Crore', bonusLabel: '3% (₹3,00,000)', achieved: false }
];

// Achiever Bonus (Direct Business in 4 months, PDF Section 5)
export const ACHIEVER_BONUSES = [
  { target: 500000, reward: 'Goa Trip', targetLabel: '₹5,00,000', unlocked: true, daysRemaining: 0, icon: 'palmtree' },
  { target: 1500000, reward: 'Andaman Trip', targetLabel: '₹15,00,000', unlocked: false, daysRemaining: 34, icon: 'anchor' },
  { target: 3000000, reward: 'Thailand Trip', targetLabel: '₹30,00,000', unlocked: false, daysRemaining: 34, icon: 'plane' },
  { target: 5000000, reward: 'Dubai Trip', targetLabel: '₹50,00,000', unlocked: false, daysRemaining: 34, icon: 'building' },
  { target: 10000000, reward: 'Europe Trip', targetLabel: '₹1,00,00,000', unlocked: false, daysRemaining: 34, icon: 'globe' }
];

// Initial Transactions
export const INITIAL_TRANSACTIONS = [
  {
    id: 'TXN-90241',
    type: 'deposit',
    method: 'USDT (BEP-20)',
    title: 'Deposit · USDT (BEP-20)',
    date: '21 Oct, 14:32',
    timestamp: Date.now() - 3600000 * 2,
    amount: 100000,
    amountFormatted: '+₹1,00,000',
    status: 'Completed',
    txHash: '0x9fa4b2e88a104c995...b3e81',
    wallet: 'Main Deposit Wallet'
  },
  {
    id: 'TXN-89943',
    type: 'roi',
    method: 'Daily ROI',
    title: 'ROI income · Daily 0.45%',
    date: '21 Oct, 00:05',
    timestamp: Date.now() - 3600000 * 16,
    amount: 2250,
    amountFormatted: '+₹2,250',
    status: 'Completed',
    txHash: 'Internal · System Automation',
    wallet: 'ROI Wallet'
  },
  {
    id: 'TXN-89410',
    type: 'roi',
    method: 'Daily ROI',
    title: 'ROI income · Daily 0.45%',
    date: '20 Oct, 00:05',
    timestamp: Date.now() - 3600000 * 40,
    amount: 2250,
    amountFormatted: '+₹2,250',
    status: 'Completed',
    txHash: 'Internal · System Automation',
    wallet: 'ROI Wallet'
  },
  {
    id: 'TXN-88192',
    type: 'referral',
    method: 'Level 1 (5%)',
    title: 'Referral income · Level 1 (5%)',
    date: '20 Oct, 00:10',
    timestamp: Date.now() - 3600000 * 41,
    amount: 1125,
    amountFormatted: '+₹1,125',
    status: 'Completed',
    txHash: 'Internal · ROI-on-ROI Commission',
    wallet: 'Referral Wallet'
  },
  {
    id: 'TXN-87654',
    type: 'deposit',
    method: 'INR (UPI)',
    title: 'Deposit · INR (UPI)',
    date: '18 Oct, 11:20',
    timestamp: Date.now() - 3600000 * 80,
    amount: 250000,
    amountFormatted: '+₹2,50,000',
    status: 'Completed',
    txHash: 'UTR: 329104819024',
    wallet: 'Main Deposit Wallet'
  },
  {
    id: 'TXN-86512',
    type: 'withdraw',
    method: 'USDT (BEP-20)',
    title: 'Withdraw · USDT (BEP-20)',
    date: '15 Oct, 16:45',
    timestamp: Date.now() - 3600000 * 140,
    amount: -25000,
    amountFormatted: '-₹25,000',
    status: 'Completed',
    txHash: '0x12c884f93b5a1934...90d1f',
    wallet: 'ROI Wallet'
  }
];

// Initial Referral Members (PDF Section 3 hierarchy)
export const INITIAL_TEAM = {
  1: [
    { id: 'M-101', name: 'Aarav Sharma', joined: '12 Oct', active: '₹2,50,000', package: 'Pro Trader', dailyRoi: '₹1,125', myCommission: '₹56.25/day', status: 'Active' },
    { id: 'M-102', name: 'Meera Iyer', joined: '04 Oct', active: '₹50,000', package: 'Basic Growth', dailyRoi: '₹225', myCommission: '₹11.25/day', status: 'Active' },
    { id: 'M-103', name: 'Kabir Nair', joined: '27 Sep', active: '₹5,00,000', package: 'Premium Wealth', dailyRoi: '₹2,250', myCommission: '₹112.50/day', status: 'Active' },
    { id: 'M-104', name: 'Vikram Patel', joined: '20 Sep', active: '₹4,50,000', package: 'Pro Trader+', dailyRoi: '₹2,025', myCommission: '₹101.25/day', status: 'Active' }
  ],
  2: [
    { id: 'M-201', name: 'Isha Verma', joined: '15 Oct', active: '₹10,000', package: 'Starter Package', dailyRoi: '₹45', myCommission: '₹0.90/day', status: 'Active' },
    { id: 'M-202', name: 'Rohan Das', joined: '09 Oct', active: '₹50,000', package: 'Basic Growth', dailyRoi: '₹225', myCommission: '₹4.50/day', status: 'Active' },
    { id: 'M-203', name: 'Priya Sen', joined: '02 Oct', active: '₹1,00,000', package: 'Pro Growth', dailyRoi: '₹450', myCommission: '₹9.00/day', status: 'Active' }
  ],
  3: [
    { id: 'M-301', name: 'Tanvi Joshi', joined: '17 Oct', active: '₹2,50,000', package: 'Pro Trader', dailyRoi: '₹1,125', myCommission: '₹22.50/day', status: 'Active' },
    { id: 'M-302', name: 'Amit Ray', joined: '11 Oct', active: '₹50,000', package: 'Basic Growth', dailyRoi: '₹225', myCommission: '₹4.50/day', status: 'Active' }
  ],
  4: [
    { id: 'M-401', name: 'Dev Malhotra', joined: '19 Oct', active: '₹10,000', package: 'Starter Package', dailyRoi: '₹45', myCommission: '₹0.90/day', status: 'Active' }
  ],
  5: [
    { id: 'M-501', name: 'Sana Qureshi', joined: '20 Oct', active: '₹50,000', package: 'Basic Growth', dailyRoi: '₹225', myCommission: '₹4.50/day', status: 'Active' }
  ]
};

// Initial Notifications
export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Deposit completed',
    body: '₹1,00,000 via USDT (BEP-20) has been credited to your wallet.',
    time: '21 Oct, 14:32',
    unread: true,
    type: 'deposit',
    iconType: 'deposit'
  },
  {
    id: 'notif-2',
    title: 'Daily ROI credited',
    body: '₹2,250 ROI income (0.45%) was added to your ROI wallet.',
    time: '21 Oct, 00:05',
    unread: true,
    type: 'roi',
    iconType: 'roi'
  },
  {
    id: 'notif-3',
    title: 'Referral commission',
    body: '₹1,125 Level 1 commission (5% on ROI) was credited.',
    time: '20 Oct, 00:10',
    unread: false,
    type: 'referral',
    iconType: 'referral'
  },
  {
    id: 'notif-4',
    title: 'Andaman trip progress',
    body: 'Direct volume is ₹12.5L of ₹15L. Keep building your team to unlock the pass.',
    time: '19 Oct, 09:00',
    unread: false,
    type: 'bonus',
    iconType: 'trip'
  },
  {
    id: 'notif-5',
    title: 'Account secured',
    body: 'KYC and 2FA are active on your account.',
    time: '18 Oct, 11:25',
    unread: false,
    type: 'security',
    iconType: 'security'
  }
];

// Admin Platform Data
export const INITIAL_ADMIN_PENDING_REQUESTS = [
  {
    id: 'DEP-REQ-101',
    type: 'deposit',
    user: 'Deepak Chopra (UNC-77182)',
    method: 'INR (UPI)',
    amount: 50000,
    reference: 'UTR: 409182390141',
    date: 'Just now',
    status: 'Pending'
  },
  {
    id: 'DEP-REQ-102',
    type: 'deposit',
    user: 'Kavita Sundaram (UNC-91204)',
    method: 'USDT (BEP-20)',
    amount: 250000,
    reference: '0x9ca729...e491',
    date: '12 min ago',
    status: 'Pending'
  },
  {
    id: 'WTH-REQ-201',
    type: 'withdrawal',
    user: 'Rutajeet Mukherjee (UNC-88294)',
    method: 'USDT (BEP-20)',
    amount: 15000,
    reference: '0x71C5A869d2319fBc9057bA27218Ac9bB38A9',
    walletSource: 'ROI Wallet',
    date: '35 min ago',
    twoFactorVerified: true,
    status: 'Pending'
  }
];

