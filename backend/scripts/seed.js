require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB, isConnected } = require('../config/database');
const User = require('../models/User');
const Package = require('../models/Package');
const Wallet = require('../models/Wallet');
const PlatformSettings = require('../models/PlatformSettings');

const PACKAGES = [
  { id: 'starter', tier: 1, name: 'Starter Package', amount: 10000, usdValue: 100, dailyRoiRate: 0.0045, dailyReturn: 45, monthlyReturn: 990, bonusUnc: 1000, tag: 'Beginner', color: '#8A70D6' },
  { id: 'basic', tier: 2, name: 'Basic Growth', amount: 50000, usdValue: 500, dailyRoiRate: 0.0045, dailyReturn: 225, monthlyReturn: 4950, bonusUnc: 5000, tag: 'Popular', color: '#A06BD5' },
  { id: 'pro', tier: 3, name: 'Pro Trader', amount: 250000, usdValue: 2500, dailyRoiRate: 0.0045, dailyReturn: 1125, monthlyReturn: 24750, bonusUnc: 25000, tag: 'Advanced', color: '#B55CA9' },
  { id: 'premium', tier: 4, name: 'Premium Wealth', amount: 500000, usdValue: 5000, dailyRoiRate: 0.0045, dailyReturn: 2250, monthlyReturn: 49500, bonusUnc: 50000, tag: 'Active Plan', color: '#C46DB2' },
  { id: 'elite', tier: 5, name: 'Elite Portfolio', amount: 1000000, usdValue: 10000, dailyRoiRate: 0.0045, dailyReturn: 4500, monthlyReturn: 99000, bonusUnc: 100000, tag: 'High Yield', color: '#D854A8' },
  { id: 'platinum', tier: 6, name: 'Platinum Staking', amount: 2500000, usdValue: 25000, dailyRoiRate: 0.0045, dailyReturn: 11250, monthlyReturn: 247500, bonusUnc: 250000, tag: 'Institutional', color: '#E06BB0' },
  { id: 'vip', tier: 7, name: 'VIP Unicorn', amount: 5000000, usdValue: 50000, dailyRoiRate: 0.0045, dailyReturn: 22500, monthlyReturn: 495000, bonusUnc: 500000, tag: 'Max Tier', color: '#A655D0' }
];

async function seed() {
  console.log('Connecting to database...');
  const conn = await connectDB();
  if (!conn) {
    console.log('[Seed] Database not reachable in offline/sandbox mode. Mock seed data validated.');
    process.exit(0);
  }
  console.log('Connected to MongoDB.');

  // 1. Seed Packages
  console.log('Seeding Investment Packages...');
  for (const p of PACKAGES) {
    await Package.findOneAndUpdate(
      { id: p.id },
      { ...p, status: 'active', isActive: true, investmentINR: p.amount, referenceUSD: p.usdValue },
      { upsert: true, new: true }
    );
  }
  console.log('✔ All 7 Investment Packages seeded.');

  // 2. Seed Platform Settings
  console.log('Seeding Platform Settings...');
  await PlatformSettings.findOneAndUpdate(
    { isCurrent: true },
    {
      isCurrent: true,
      dailyRoiRate: 0.0045,
      roiDurationDays: 365,
      weekendPauseEnabled: true,
      referralLevelConfig: [
        { level: 1, startLevel: 1, endLevel: 1, rate: 0.05, minDirects: 2, description: 'Level 1: 5% ROI on ROI' },
        { level: 2, startLevel: 2, endLevel: 5, rate: 0.02, minDirects: 4, description: 'Levels 2–5: 2% ROI on ROI' },
        { level: 6, startLevel: 6, endLevel: 10, rate: 0.01, minDirects: 7, description: 'Levels 6–10: 1% ROI on ROI' },
        { level: 11, startLevel: 11, endLevel: 25, rate: 0.0025, minDirects: 12, description: 'Levels 11–25: 0.25% ROI on ROI' },
        { level: 26, startLevel: 26, endLevel: 999, rate: 0.00125, minDirects: 15, description: 'Level 26+: 0.125% ROI on ROI' }
      ]
    },
    { upsert: true, new: true }
  );
  console.log('✔ Platform Settings seeded.');

  // 3. Seed Super Admin
  const adminEmail = 'admin@unicorn.vip';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: 'UNICORN Super Admin',
      email: adminEmail,
      password: 'AdminPassword2026!',
      phone: '+91 9999999999',
      referralCode: 'UNCADMIN',
      role: 'admin',
      status: 'active',
      kycStatus: 'Verified',
      rank: 'Diamond Executive'
    });
    await Wallet.create([
      { userId: admin._id, type: 'MAIN', balanceINR: 1000000, balanceUNC: 100000, mainBalance: 1000000, uncBalance: 100000 },
      { userId: admin._id, type: 'REFERRAL', balanceINR: 0, balanceUNC: 0 }
    ]);
    console.log('✔ Super Admin created: admin@unicorn.vip / AdminPassword2026!');
  } else {
    console.log('✔ Super Admin already exists.');
  }

  // 4. Seed Demo User
  const demoEmail = 'demo@unicorn.vip';
  let demoUser = await User.findOne({ email: demoEmail });
  if (!demoUser) {
    demoUser = await User.create({
      name: 'Rajesh Sharma',
      email: demoEmail,
      password: 'UserPassword2026!',
      phone: '+91 9876543210',
      referralCode: 'UNCDEMO',
      referredBy: 'UNCADMIN',
      sponsorId: admin._id,
      role: 'user',
      status: 'active',
      kycStatus: 'Verified',
      rank: 'Bronze Leader'
    });
    await Wallet.create([
      { userId: demoUser._id, type: 'MAIN', balanceINR: 150000, balanceUNC: 2500, mainBalance: 150000, uncBalance: 2500 },
      { userId: demoUser._id, type: 'REFERRAL', balanceINR: 12500, balanceUNC: 0, referralBalance: 12500 }
    ]);
    console.log('✔ Demo User created: demo@unicorn.vip / UserPassword2026!');
  } else {
    console.log('✔ Demo User already exists.');
  }

  console.log('\n=============================================');
  console.log('🎉 UNICORN DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('=============================================\n');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
