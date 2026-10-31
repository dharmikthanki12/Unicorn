const path = require('path');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// Models
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Deposit = require('../models/Deposit');
const Investment = require('../models/Investment');
const Withdrawal = require('../models/Withdrawal');

async function testFullAtlasFlow() {
  console.log('========================================================');
  console.log('🚀 TESTING FULL END-TO-END FLOW DIRECTLY ON MONGO ATLAS');
  console.log('========================================================');

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000
    });
    console.log('✅ Connected to MongoDB Atlas: cluster0.lqgakzj.mongodb.net/unicorn');

    // 1. Create a test user via User model
    const testTag = Date.now().toString().slice(-4);
    const email = `investor_${testTag}@unicorn.vip`;
    const password = 'Password@123';
    const name = `Investor ${testTag}`;
    const referralCode = `UNC${Math.floor(1000 + Math.random() * 9000)}`;

    console.log(`\n1. Creating User: ${email}...`);
    const user = await User.create({
      name,
      email,
      password,
      referralCode,
      kycStatus: 'VERIFIED'
    });
    console.log(`   ✅ User created with _id: ${user._id}, Referral: ${user.referralCode}`);

    // 2. Create 3 isolated wallets for this user
    console.log('\n2. Initializing 3-Wallet isolated ledger...');
    const wallets = await Wallet.create([
      { userId: user._id, type: 'MAIN', balance: 50000, balanceINR: 50000, balanceUNC: 100, mainBalance: 50000, uncBalance: 100 },
      { userId: user._id, type: 'ROI', balance: 12000, balanceINR: 12000, balanceUNC: 0, roiBalance: 12000 },
      { userId: user._id, type: 'REFERRAL', balance: 5000, balanceINR: 5000, balanceUNC: 0, referralBalance: 5000 }
    ]);
    console.log(`   ✅ Created ${wallets.length} wallets (MAIN: ₹50,000, ROI: ₹12,000, REFERRAL: ₹5,000)`);

    // 3. Create Deposit Record
    console.log('\n3. Creating INR UPI Deposit Record (₹1,00,000)...');
    const deposit = await Deposit.create({
      userId: user._id,
      amount: 100000,
      amountINR: 100000,
      currency: 'INR',
      paymentMethod: 'UPI',
      transactionReference: `UTR_${Date.now()}`,
      status: 'APPROVED',
      approvedAt: new Date()
    });
    console.log(`   ✅ Deposit record created in Atlas (ID: ${deposit._id}, Status: ${deposit.status})`);

    // Update main wallet balance
    await Wallet.updateOne({ userId: user._id, type: 'MAIN' }, { $inc: { balance: 100000, balanceINR: 100000, mainBalance: 100000 } });
    console.log('   ✅ Main wallet updated (+₹1,00,000). Total: ₹1,50,000');

    // 4. Activate Investment Package
    console.log('\n4. Activating Basic Growth Investment Package (₹50,000)...');
    const investment = await Investment.create({
      userId: user._id,
      packageId: 'tier_2',
      packageName: 'Basic Growth',
      tier: 2,
      amount: 50000,
      dailyRoiAmount: 225,
      status: 'confirmed'
    });
    console.log(`   ✅ Investment registered in Atlas (ID: ${investment._id}, Daily ROI: ₹225/day)`);

    // 5. Test Withdrawal request
    console.log('\n5. Creating Withdrawal Request from ROI Wallet (₹5,000)...');
    const withdrawal = await Withdrawal.create({
      userId: user._id,
      amount: 5000,
      netAmount: 4750,
      feeAmount: 250,
      walletSource: 'roi',
      payoutMethod: 'upi',
      destinationAddress: 'investor@okhdfcbank',
      status: 'PENDING'
    });
    console.log(`   ✅ Withdrawal created in Atlas (ID: ${withdrawal._id}, Amount: ₹5,000, Status: ${withdrawal.status})`);

    // 6. Verification counts from Atlas
    console.log('\n========================================================');
    console.log('📊 FINAL MONGO ATLAS COLLECTION TOTALS:');
    console.log('========================================================');
    const db = mongoose.connection.db;
    const usersCount = await db.collection('users').countDocuments();
    const walletsCount = await db.collection('wallets').countDocuments();
    const depositsCount = await db.collection('deposits').countDocuments();
    const investmentsCount = await db.collection('investments').countDocuments();
    const withdrawalsCount = await db.collection('withdrawals').countDocuments();

    console.log(`- users:         ${usersCount} documents`);
    console.log(`- wallets:       ${walletsCount} documents`);
    console.log(`- deposits:      ${depositsCount} documents`);
    console.log(`- investments:   ${investmentsCount} documents`);
    console.log(`- withdrawals:   ${withdrawalsCount} documents`);
    console.log('========================================================');
    console.log('🎉 ALL DATA WRITTEN AND PERSISTED TO LIVE ATLAS CLUSTER!');
    console.log('========================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error during Atlas full flow test:', err);
    process.exit(1);
  }
}

testFullAtlasFlow();
