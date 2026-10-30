require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const { runDailyRoiJob } = require('./jobs/roiJob');
const User = require('./models/User');
const Package = require('./models/Package');
const Wallet = require('./models/Wallet');

const PORT = process.env.PORT || 5000;

const DEFAULT_PACKAGES = [
  { id: 'starter', tier: 1, name: 'Starter Package', amount: 10000, usdValue: 100, dailyRoiRate: 0.0045, dailyReturn: 45, monthlyReturn: 990, bonusUnc: 1000, tag: 'Beginner', color: '#8A70D6' },
  { id: 'basic', tier: 2, name: 'Basic Growth', amount: 50000, usdValue: 500, dailyRoiRate: 0.0045, dailyReturn: 225, monthlyReturn: 4950, bonusUnc: 5000, tag: 'Popular', color: '#A06BD5' },
  { id: 'pro', tier: 3, name: 'Pro Trader', amount: 250000, usdValue: 2500, dailyRoiRate: 0.0045, dailyReturn: 1125, monthlyReturn: 24750, bonusUnc: 25000, tag: 'Advanced', color: '#B55CA9' },
  { id: 'premium', tier: 4, name: 'Premium Wealth', amount: 500000, usdValue: 5000, dailyRoiRate: 0.0045, dailyReturn: 2250, monthlyReturn: 49500, bonusUnc: 50000, tag: 'Active Plan', color: '#C46DB2' },
  { id: 'elite', tier: 5, name: 'Elite Portfolio', amount: 1000000, usdValue: 10000, dailyRoiRate: 0.0045, dailyReturn: 4500, monthlyReturn: 99000, bonusUnc: 100000, tag: 'High Yield', color: '#D854A8' },
  { id: 'platinum', tier: 6, name: 'Platinum Staking', amount: 2500000, usdValue: 25000, dailyRoiRate: 0.0045, dailyReturn: 11250, monthlyReturn: 247500, bonusUnc: 250000, tag: 'Institutional', color: '#E06BB0' },
  { id: 'vip', tier: 7, name: 'VIP Unicorn', amount: 5000000, usdValue: 50000, dailyRoiRate: 0.0045, dailyReturn: 22500, monthlyReturn: 495000, bonusUnc: 500000, tag: 'Max Tier', color: '#A655D0' }
];

async function seedInitialData() {
  try {
    // Seed packages
    const packageCount = await Package.countDocuments();
    if (packageCount === 0) {
      for (const p of DEFAULT_PACKAGES) {
        await Package.create(p);
      }
      console.log('[Seed] 7 Investment Packages seeded successfully.');
    }

    // Seed default Admin if not exists
    const adminExists = await User.findOne({ email: 'admin@unicorn.io' });
    if (!adminExists) {
      const admin = await User.create({
        name: 'Protocol Super Admin',
        email: 'admin@unicorn.io',
        password: 'adminPassword123',
        phone: '+91 98765 00000',
        referralCode: 'UNIOFFICIAL',
        role: 'admin',
        kycStatus: 'Verified'
      });

      await Wallet.create({
        userId: admin._id,
        mainBalance: 10000000,
        roiBalance: 0,
        referralBalance: 0,
        uncBalance: 10000000
      });

      console.log('[Seed] Default Super Admin seeded: admin@unicorn.io / adminPassword123');
    }
  } catch (e) {
    console.warn('[Seed Notice]', e.message);
  }
}

async function startServer() {
  await connectDB();
  await seedInitialData();

  const server = app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🦄 UNICORN Enterprise Backend active on port ${PORT}`);
    console.log(`📡 Base API URL: http://localhost:${PORT}/api`);
    console.log(`🛡️ Security: Helmet, CORS & Rate Limiter Active`);
    console.log(`⚙️ Database: MongoDB with Mongoose Schema Engine`);
    console.log(`====================================================`);
  });

  // Automated 24-Hour Daily ROI Background Cycle
  setInterval(async () => {
    try {
      await runDailyRoiJob();
    } catch (err) {
      console.error('[Scheduler Error]', err.message);
    }
  }, 24 * 60 * 60 * 1000);

  // Graceful shutdown
  const handleExit = () => {
    console.log('\nShutting down UNICORN backend server...');
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', handleExit);
  process.on('SIGINT', handleExit);
}

startServer();
