const mongoose = require('mongoose');
const dns = require('dns');

// On Windows local dev only, set custom DNS if needed for SRV resolution
// NEVER run dns.setServers on Linux / AWS Lambda / Vercel where it breaks VPC DNS
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  } catch (e) {}
}

let cachedPromise = null;

const connectDB = async (retryCount = 0) => {
  // If already connected, reuse connection immediately (0ms)
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If currently connecting, await existing promise
  if (cachedPromise) {
    return cachedPromise;
  }

  const mongoURI = process.env.MONGODB_URI || 'mongodb://zarwebcoders:zarwebcoders@ac-3l1aapn-shard-00-00.lqgakzj.mongodb.net:27017,ac-3l1aapn-shard-00-01.lqgakzj.mongodb.net:27017,ac-3l1aapn-shard-00-02.lqgakzj.mongodb.net:27017/unicorn?ssl=true&replicaSet=atlas-a9yoh9-shard-0&authSource=admin&retryWrites=true&w=majority';

  cachedPromise = mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 15000, // Increased for Vercel cold start
    connectTimeoutMS: 15000,         // Increased for Vercel cold start
    socketTimeoutMS: 30000,
    maxPoolSize: 5                   // Lower pool size for serverless
  }).then(conn => {
    console.log(`[Database] MongoDB Atlas Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  }).catch(async err => {
    cachedPromise = null;
    console.error(`[Database] Connection Error: ${err.message}`);
    if (retryCount < 2) { // Retry up to 2 times on cold start
      console.log(`[Database] Retrying connection attempt ${retryCount + 1}/2 in 2s...`);
      await new Promise(r => setTimeout(r, 2000));
      return connectDB(retryCount + 1);
    }
    throw err;
  });

  return cachedPromise;
};

module.exports = {
  connectDB,
  isConnected: () => mongoose.connection.readyState === 1
};

