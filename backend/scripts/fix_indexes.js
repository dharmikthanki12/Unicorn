const path = require('path');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

async function fixIndexes() {
  const mongoURI = process.env.MONGODB_URI;
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000
    });
    console.log('✅ Connected to MongoDB Atlas');

    const db = mongoose.connection.db;
    const usersCol = db.collection('users');
    
    // Drop userId_1 if still exists
    try {
      await usersCol.dropIndex('userId_1');
      console.log('Dropped userId_1');
    } catch(e) {}

    // Drop old walletAddress_1 and create a safe index where only non-empty strings must be unique
    try {
      await usersCol.dropIndex('walletAddress_1');
      console.log('Dropped old walletAddress_1 index');
    } catch(e) {}

    await usersCol.createIndex(
      { walletAddress: 1 },
      {
        unique: true,
        partialFilterExpression: { walletAddress: { $type: 'string', $gt: '' } },
        name: 'walletAddress_1'
      }
    );
    console.log('✅ Created robust walletAddress_1 index with $gt: ""');

    // Any users with empty string walletAddress, set to null
    await usersCol.updateMany({ walletAddress: '' }, { $set: { walletAddress: null } });

    const indexes = await usersCol.indexes();
    console.log('\nFinal indexes on "users":');
    console.log(JSON.stringify(indexes, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing indexes:', err);
    process.exit(1);
  }
}

fixIndexes();
