const bcrypt = require('bcryptjs');
const { DB } = require('./models');
const { INVESTMENT_PACKAGES } = require('./config/constants');

async function seedInitialData() {
  const existingUsers = await DB.users.find();
  if (existingUsers && existingUsers.length > 0) {
    return; // Already seeded
  }

  console.log('[Seed] Seeding initial users and demo data...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  // 1. Create Protocol Super Admin
  const admin = await DB.users.create({
    name: 'Unicorn Protocol Admin',
    email: 'admin@unicorn.io',
    password: adminPassword,
    phone: '+91 98765 00000',
    referralCode: 'UNIOFFICIAL',
    role: 'admin',
    mainWalletBalance: 10000000,
    roiWalletBalance: 0,
    referralWalletBalance: 0,
    uncBalance: 10000000,
    kycStatus: 'Verified',
    rank: 'Unicorn Legend'
  });

  // 2. Create Active Member User (Dharmik / User)
  const user = await DB.users.create({
    name: 'Dharmik Thanki',
    email: 'dharmik@unicorn.io',
    password: userPassword,
    phone: '+91 98765 43210',
    referralCode: 'UNC7824',
    referredBy: 'UNIOFFICIAL',
    role: 'user',
    mainWalletBalance: 150000,
    roiWalletBalance: 54000,
    referralWalletBalance: 38750,
    uncBalance: 50000,
    activeInvestedAmount: 500000, // Premium Wealth
    todayRoiIncome: 2250,
    todayReferralIncome: 1125,
    directBusiness: 1250000,
    teamBusiness: 8500000,
    directsCount: 4,
    rank: 'Gold Executive',
    kycStatus: 'Verified',
    web3Address: '0x86ff73998b5A4dE1E90bEb8415F1560B05efF377',
    web3Connected: true,
    claimedRankRewards: ['rank_250000', 'rank_500000'],
    achieverTripsWon: ['Goa Trip']
  });

  // 3. Create 4 Direct Referral Members
  const directsData = [
    { name: 'Vikram Mehta', email: 'vikram@example.com', amount: 500000, code: 'VIK5820' },
    { name: 'Ananya Sharma', email: 'ananya@example.com', amount: 500000, code: 'ANA3912' },
    { name: 'Rahul Joshi', email: 'rahul@example.com', amount: 250000, code: 'RAH8190' },
    { name: 'Pooja Verma', email: 'pooja@example.com', amount: 50000, code: 'POO1425' }
  ];

  for (const d of directsData) {
    const dPass = await bcrypt.hash('pass123', 10);
    await DB.users.create({
      name: d.name,
      email: d.email,
      password: dPass,
      referralCode: d.code,
      referredBy: user.referralCode,
      mainWalletBalance: 25000,
      activeInvestedAmount: d.amount,
      directBusiness: 0,
      teamBusiness: 0,
      directsCount: 0,
      rank: 'Bronze Leader'
    });
  }

  // 4. Create Active Investment for User
  await DB.investments.create({
    userId: user._id,
    packageId: 'premium',
    packageName: 'Premium Wealth',
    tier: 4,
    amount: 500000,
    dailyRoi: 2250,
    bonusUnc: 50000,
    status: 'active'
  });

  // 5. Create Initial Ledger Transactions
  await DB.transactions.create({
    userId: user._id,
    type: 'deposit',
    amount: 100000,
    amountFormatted: '+₹1,00,000',
    title: 'Deposit · USDT (BEP-20)',
    subtitle: 'Tx: 0x93f4...281a',
    status: 'completed',
    txHash: '0x93f4e91029ba81b0a7c413b18c64281a'
  });

  await DB.transactions.create({
    userId: user._id,
    type: 'roi',
    amount: 2250,
    amountFormatted: '+₹2,250',
    title: 'ROI income · Daily 0.45%',
    subtitle: 'Premium Wealth (Tier 4)',
    status: 'completed'
  });

  await DB.transactions.create({
    userId: user._id,
    type: 'referral',
    amount: 1125,
    amountFormatted: '+₹1,125',
    title: 'Referral income · Level 1 (5%)',
    subtitle: 'Downline daily ROI distribution',
    status: 'completed'
  });

  // 6. Create Initial Admin Review Pending Requests
  await DB.deposits.create({
    userId: user._id,
    userEmail: user.email,
    userName: user.name,
    amount: 100000,
    currency: 'INR',
    method: 'UPI',
    utrOrTxHash: 'UPI482910492817',
    status: 'pending'
  });

  await DB.withdrawals.create({
    userId: user._id,
    userEmail: user.email,
    userName: user.name,
    sourceWallet: 'roi',
    amount: 25000,
    payoutMethod: 'crypto',
    payoutDetails: {
      bep20Address: '0x86ff73998b5A4dE1E90bEb8415F1560B05efF377',
      network: 'BSC'
    },
    status: 'pending'
  });

  console.log('[Seed] Data initialization completed.');
}

module.exports = {
  seedInitialData
};
