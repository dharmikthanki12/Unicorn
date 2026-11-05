require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { seedInitialData } = require('./seed');
const { processDailyROI } = require('./services/roiEngine');

const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
const investRoutes = require('./routes/investRoutes');
const referralRoutes = require('./routes/referralRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    protocol: 'UNICORN Web3 Investment & Rewards Protocol',
    version: '1.0.0',
    token: 'Unicorn (UNC) BEP-20',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/invest', investRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Start Server
async function startServer() {
  await connectDB();
  await seedInitialData();

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 UNICORN Web3 Backend running on port ${PORT}`);
    console.log(`📡 API Endpoints: http://localhost:${PORT}/api`);
    console.log(`🦄 UNC Token: 100,000,000 UNC (BEP-20)`);
    console.log(`📈 Daily ROI Engine: 0.45% Active`);
    console.log(`👥 Multi-Level ROI-on-ROI Referral Matrix: Active`);
    console.log(`====================================================`);
  });

  // Automated 24-hour Daily ROI Cycle (Runs once per day)
  // 86,400,000 ms = 24 hours
  setInterval(async () => {
    try {
      console.log('[Scheduler] Executing scheduled daily 0.45% ROI cycle...');
      await processDailyROI();
    } catch (e) {
      console.error('[Scheduler Error]', e);
    }
  }, 24 * 60 * 60 * 1000);
}

startServer();

