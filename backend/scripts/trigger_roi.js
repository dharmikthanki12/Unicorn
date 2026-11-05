// backend/scripts/trigger_roi.js
// Standalone script executed by GitHub Actions or cron jobs to trigger the daily 0.45% ROI engine.

require('dotenv').config({ path: './backend/.env' });
require('dotenv').config();

const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const { runDailyRoiJob } = require('../jobs/roiJob');

async function main() {
  console.log('====================================================');
  console.log('🦄 UNICORN PROTOCOL — GITHUB ACTIONS ROI RUNNER');
  console.log('====================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://zarwebcoders:zarwebcoders@cluster0.lqgakzj.mongodb.net/unicorn?retryWrites=true&w=majority';
  process.env.MONGODB_URI = mongoURI;

  try {
    console.log('[Runner] Connecting to MongoDB Atlas...');
    await connectDB();
    console.log('[Runner] MongoDB Atlas Connected.');

    const forceRun = process.env.FORCE_RUN === 'true';
    if (forceRun) {
      console.log('[Runner] ⚠️ FORCE_RUN is enabled. Bypassing weekend and holiday pauses.');
    }

    const result = await runDailyRoiJob({ forceRun });

    console.log('\n====================================================');
    console.log('📊 DAILY ROI JOB SUMMARY');
    console.log('====================================================');
    if (result.paused) {
      console.log(`⏸️  CYCLE PAUSED: ${result.reason}`);
    } else {
      console.log(`✅ Status: SUCCESS`);
      console.log(`📦 Processed Investments: ${result.processedCount}`);
      console.log(`💰 Total ROI Credited: ₹${Number(result.totalRoiPaid || 0).toLocaleString('en-IN')}`);
      console.log(`📅 Target Date: ${result.date}`);
    }
    console.log('====================================================\n');

    await mongoose.disconnect();
    console.log('[Runner] Database disconnected cleanly.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ [Runner Error] ROI Job failed:', error.message);
    if (error.stack) console.error(error.stack);
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  }
}

main();

