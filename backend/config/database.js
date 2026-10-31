const mongoose = require('mongoose');
const dns = require('dns');

// On Windows, configure reliable DNS for MongoDB Atlas SRV resolution
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

let isConnected = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://zarwebcoders:zarwebcoders@cluster0.lqgakzj.mongodb.net/unicorn?retryWrites=true&w=majority';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000
    });
    isConnected = true;
    console.log(`[Database] MongoDB Atlas Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    isConnected = false;
    console.warn(`[Database] MongoDB Atlas connection notice (${err.message}).`);
    return null;
  }
};

module.exports = {
  connectDB,
  isConnected: () => isConnected
};

