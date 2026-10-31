const path = require('path');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { generateAccessToken } = require('../utils/generateToken');

async function createAndTestUser() {
  const mongoURI = process.env.MONGODB_URI;
  console.log('====================================================');
  console.log('🦄 UNICORN ATLAS LIVE USER CREATION & TEST');
  console.log('====================================================');
  console.log('Target MongoDB URI:', mongoURI.replace(/:[^:]*@/, ':****@'));

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000
    });
    console.log(`✅ Connected to MongoDB Atlas: ${conn.connection.host}`);
    console.log(`📦 Database Name: ${conn.connection.name}`);

    // 1. Initial count
    const initialCount = await User.countDocuments();
    console.log(`📊 Current Users Count in Atlas: ${initialCount}`);

    // 2. Define test user credentials
    const timestamp = Date.now().toString().slice(-4);
    const testEmail = `dharmik_${timestamp}@unicorn.vip`;
    const testName = 'Dharmik Thanki';
    const testPassword = 'Unicorn2026!Secure';
    const testWallet = `0x${Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('')}`;
    const testRefCode = `UNC${Math.floor(1000 + Math.random() * 9000)}`;

    console.log('\n--- Creating New User in MongoDB Atlas ---');
    console.log(`Name:            ${testName}`);
    console.log(`Email:           ${testEmail}`);
    console.log(`Password:        ${testPassword}`);
    console.log(`BEP-20 Wallet:   ${testWallet}`);
    console.log(`Referral Code:   ${testRefCode}`);

    // 3. Insert into User collection
    const newUser = await User.create({
      name: testName,
      email: testEmail,
      password: testPassword,
      phone: '+91 9876543210',
      referralCode: testRefCode,
      walletAddress: testWallet,
      web3Connected: true,
      role: 'user',
      status: 'active',
      kycStatus: 'VERIFIED',
      rank: 'Starter Unicorn',
      lastLoginAt: new Date()
    });

    console.log(`\n✅ User successfully created in MongoDB Atlas! User ID: ${newUser._id}`);

    // 4. Create 3 Isolated Wallets (MAIN, ROI, REFERRAL)
    console.log('\n--- Initializing 3-Wallet Isolated Ledger Accounts ---');
    const wallets = await Wallet.create([
      {
        userId: newUser._id,
        type: 'MAIN',
        balance: 100000,
        balanceINR: 100000,
        balanceUNC: 1000,
        mainBalance: 100000,
        uncBalance: 1000
      },
      {
        userId: newUser._id,
        type: 'ROI',
        balance: 5400,
        balanceINR: 5400,
        roiBalance: 5400
      },
      {
        userId: newUser._id,
        type: 'REFERRAL',
        balance: 3875,
        balanceINR: 3875,
        referralBalance: 3875
      }
    ]);

    console.log(`✅ 3 Wallets Created:`);
    wallets.forEach(w => console.log(`   - ${w.type} Wallet: ₹${w.balance.toLocaleString('en-IN')} (ID: ${w._id})`));

    // 5. Verification: Read back directly from Atlas database
    console.log('\n--- Verifying Direct Read from MongoDB Atlas ---');
    const fetchedUser = await User.findById(newUser._id).select('+password');
    if (!fetchedUser) {
      throw new Error('User created but could not be read back from Atlas!');
    }
    console.log(`✅ Verified User exists in Atlas:`);
    console.log(`   - ID:            ${fetchedUser._id}`);
    console.log(`   - Name:          ${fetchedUser.name}`);
    console.log(`   - Email:         ${fetchedUser.email}`);
    console.log(`   - BEP-20 Wallet: ${fetchedUser.walletAddress}`);
    console.log(`   - KYC Status:    ${fetchedUser.kycStatus}`);
    console.log(`   - Password Hash: ${fetchedUser.password.slice(0, 15)}... (Bcrypt encrypted)`);

    // 6. Test password comparison
    const isPasswordValid = await fetchedUser.comparePassword(testPassword);
    console.log(`✅ Password Verification Test: ${isPasswordValid ? 'PASSED (Matches Bcrypt Hash)' : 'FAILED'}`);

    // 7. Test JWT Generation
    const token = generateAccessToken(fetchedUser._id, fetchedUser.role);
    console.log(`✅ JWT Access Token Generated: ${token.slice(0, 20)}...`);

    // 8. Final Count in MongoDB Atlas
    const finalCount = await User.countDocuments();
    console.log(`\n====================================================`);
    console.log(`🎉 SUCCESS! Users Count in Atlas increased from ${initialCount} to ${finalCount}`);
    console.log(`====================================================`);
    console.log('You can now open MongoDB Compass, hit Refresh (or F5), and you will see:');
    console.log(`- 'users' collection now has ${finalCount} documents`);
    console.log(`- The new user '${testEmail}' is permanently stored!`);
    console.log('====================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating user in Atlas:', err.message);
    process.exit(1);
  }
}

createAndTestUser();
