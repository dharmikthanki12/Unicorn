const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let isConnected = false;
let useMemoryStore = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/unicorn';

  try {
    // Attempt Mongoose connection with 3-second timeout
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000
    });
    isConnected = true;
    useMemoryStore = false;
    console.log(`[Database] MongoDB Connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`[Database] MongoDB connection skipped (${err.message}).`);
    console.log('[Database] Falling back to high-performance Embedded File Store for local persistence.');
    useMemoryStore = true;
    isConnected = true;
    initFileStore();
  }
};

const storeFilePath = path.join(__dirname, '../data/store.json');

const initFileStore = () => {
  const dataDir = path.dirname(storeFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(storeFilePath)) {
    fs.writeFileSync(storeFilePath, JSON.stringify({
      users: [],
      packages: [],
      investments: [],
      transactions: [],
      deposits: [],
      withdrawals: [],
      rewards: [],
      settings: {}
    }, null, 2));
  }
};

const getStore = () => {
  try {
    initFileStore();
    const raw = fs.readFileSync(storeFilePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return {
      users: [],
      packages: [],
      investments: [],
      transactions: [],
      deposits: [],
      withdrawals: [],
      rewards: [],
      settings: {}
    };
  }
};

const saveStore = (data) => {
  try {
    initFileStore();
    fs.writeFileSync(storeFilePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('[Database] Failed to write store file:', e);
  }
};

module.exports = {
  connectDB,
  isUsingMemoryStore: () => useMemoryStore,
  getStore,
  saveStore
};

