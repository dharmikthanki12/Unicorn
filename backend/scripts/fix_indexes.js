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

    // Clean up deposits collection indexes
    const depositsCol = db.collection('deposits');
    try {
      await depositsCol.dropIndex('depositId_1');
      console.log('✅ Dropped legacy depositId_1 index on deposits');
    } catch(e) {
      console.log('Notice on deposits depositId_1:', e.message);
    }
    const depIndexes = await depositsCol.indexes();
    console.log('\nFinal indexes on "deposits":', JSON.stringify(depIndexes, null, 2));

    // Clean up withdrawals collection indexes
    const withdrawalsCol = db.collection('withdrawals');
    try {
      await withdrawalsCol.dropIndex('withdrawalId_1');
      console.log('✅ Dropped legacy withdrawalId_1 index on withdrawals');
    } catch(e) {}
    const withIndexes = await withdrawalsCol.indexes();
    console.log('\nFinal indexes on "withdrawals":', JSON.stringify(withIndexes, null, 2));

    // Clean up investments collection indexes
    const investmentsCol = db.collection('investments');
    try {
      await investmentsCol.dropIndex('investmentId_1');
      console.log('✅ Dropped legacy investmentId_1 index on investments');
    } catch(e) {}
    const invIndexes = await investmentsCol.indexes();
    console.log('\nFinal indexes on "investments":', JSON.stringify(invIndexes, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing indexes:', err);
    process.exit(1);
  }
}

fixIndexes();
