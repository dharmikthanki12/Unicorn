// api/index.js — Vercel Serverless Handler (CommonJS)
// api/package.json sets "type": "commonjs" so this file is treated as CJS,
// matching backend/ which also uses require/module.exports.

// Set env defaults BEFORE any require() so all modules see them
process.env.MONGODB_URI = process.env.MONGODB_URI ||
  'mongodb://zarwebcoders:zarwebcoders@ac-3l1aapn-shard-00-00.lqgakzj.mongodb.net:27017,ac-3l1aapn-shard-00-01.lqgakzj.mongodb.net:27017,ac-3l1aapn-shard-00-02.lqgakzj.mongodb.net:27017/unicorn?ssl=true&replicaSet=atlas-a9yoh9-shard-0&authSource=admin&retryWrites=true&w=majority';
process.env.JWT_SECRET = process.env.JWT_SECRET ||
  'unicorn_super_secret_jwt_key_2026_finance_bep20';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.SANDBOX_MODE = process.env.SANDBOX_MODE || 'true';
process.env.SMTP_USER = process.env.SMTP_USER || 'dharmikthanki5050@gmail.com';
process.env.SMTP_PASS = process.env.SMTP_PASS || 'sujfiniuuqlucuah';
process.env.FROM_EMAIL = process.env.FROM_EMAIL || 'dharmikthanki5050@gmail.com';
process.env.FROM_NAME = process.env.FROM_NAME || 'UNICORN Protocol';

const app = require('../backend/app');
const { connectDB } = require('../backend/config/database');
const mongoose = require('mongoose');

module.exports = async function handler(req, res) {
  // Connect to MongoDB if not already connected
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      console.error('[Vercel Handler] DB connect failed:', err.message);
      return res.status(503).json({
        success: false,
        message: 'Database connection failed: ' + err.message
      });
    }
  }

  // Wrap Express in a Promise so Vercel waits for the full response
  return new Promise((resolve) => {
    res.on('finish', resolve);
    res.on('close', resolve);
    app(req, res);
  });
};
