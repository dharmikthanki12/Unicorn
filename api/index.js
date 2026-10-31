import { createRequire } from 'module';
const require = createRequire(import.meta.url);

require('dotenv').config();
const app = require('../backend/app');
const { connectDB } = require('../backend/config/database');

let isConnected = false;

export default async function handler(req, res) {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (err) {
      console.error('[Vercel API] MongoDB connection error:', err.message);
    }
  }

  return app(req, res);
}
