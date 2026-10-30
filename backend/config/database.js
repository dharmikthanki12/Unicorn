const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/unicorn';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.warn(`[Database] MongoDB connection skipped (${err.message}).`);
    console.log('[Database] Operating with resilient Mongoose fallback mode.');
    return null;
  }
};

module.exports = {
  connectDB,
  isConnected: () => isConnected
};
