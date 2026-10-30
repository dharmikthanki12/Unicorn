/**
 * UNICORN In-Process Integration Test Suite
 * Directly exercises Controllers, Services, and Database Repositories
 * Without requiring external TCP socket binding.
 */

const { DB, INVESTMENT_PACKAGES } = require('./models');
const { connectDB } = require('./config/db');
const { seedInitialData } = require('./seed');
const { processDailyROI } = require('./services/roiEngine');
const { checkRankAndAchieverRewards, propagateTeamBusiness } = require('./services/rankRewardEngine');
const authController = require('./controllers/authController');
const walletController = require('./controllers/walletController');
const investController = require('./controllers/investController');
const referralController = require('./controllers/referralController');
const adminController = require('./controllers/adminController');

// Mock Express req, res helpers
function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

async function runInProcessTests() {
  console.log('====================================================');
  console.log('🧪 UNICORN FULL-STACK IN-PROCESS VALIDATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Initialize DB and Seed Data
    console.log('[Step 1] Initializing Database & Seeding Data...');
    await connectDB();
    await seedInitialData();
    assert(true, 'Database initialized (Embedded Local Persistence)');

    // 2. Test Admin Authentication & Verification
    console.log('\n[Step 2] Testing Admin Login & Password Hashing...');
    const adminReq = { body: { email: 'admin@unicorn.io', password: 'admin123' } };
    const adminRes = createMockRes();
    await authController.login(adminReq, adminRes);
    assert(adminRes.statusCode === 200 && adminRes.body.success, 'Admin login succeeded');
    assert(adminRes.body.user.role === 'admin', 'Super Admin role verified');
    const adminUser = adminRes.body.user;

    // 3. Test User Registration & Sponsor Genealogy Link
    console.log('\n[Step 3] Testing Member Registration & Referral Sponsor Link...');
    const testEmail = `trader_${Date.now()}@example.com`;
    const regReq = {
      body: {
        name: 'Karan Patel',
        email: testEmail,
        password: 'mypassword123',
        phone: '+91 99887 76655',
        referralCode: 'UNC7824' // Referred by Dharmik
      }
    };
    const regRes = createMockRes();
    await authController.register(regReq, regRes);
    assert(regRes.statusCode === 201 && regRes.body.success, 'User registered with status 201');
    assert(regRes.body.user.referredBy === 'UNC7824', 'Sponsor genealogy correctly linked to UNC7824');
    assert(regRes.body.user.referralCode.startsWith('KARA'), `Generated referral code: ${regRes.body.user.referralCode}`);
    const newUser = regRes.body.user;

    // 4. Test Web3 Wallet Association
    console.log('\n[Step 4] Testing Web3 BEP-20 Wallet Linking...');
    const web3Req = {
      user: { _id: newUser.id },
      body: { address: '0x1234567890abcdef1234567890abcdef12345678', connected: true }
    };
    const web3Res = createMockRes();
    await authController.updateWeb3Wallet(web3Req, web3Res);
    assert(web3Res.statusCode === 200 && web3Res.body.user.web3Connected === true, 'Web3 BEP-20 wallet connected');

    // 5. Test Password Recovery (Forgot Password & OTP Reset)
    console.log('\n[Step 5] Testing Account Recovery (Forgot Password & Reset)...');
    const forgotReq = { body: { email: testEmail } };
    const forgotRes = createMockRes();
    await authController.forgotPassword(forgotReq, forgotRes);
    assert(forgotRes.statusCode === 200 && forgotRes.body.previewOtp, 'Forgot password generated recovery OTP');
    const resetOtp = forgotRes.body.previewOtp;

    const resetReq = {
      body: {
        email: testEmail,
        otp: resetOtp,
        newPassword: 'newSecretPassword456'
      }
    };
    const resetRes = createMockRes();
    await authController.resetPassword(resetReq, resetRes);
    assert(resetRes.statusCode === 200 && resetRes.body.success, 'Password reset with OTP successful');

    // 6. Test Investment Packages Catalog (Section 2)
    console.log('\n[Step 6] Verifying Official Investment Packages (Section 2)...');
    const pkgRes = createMockRes();
    await investController.getPackages({}, pkgRes);
    assert(pkgRes.body.packages.length === 7, 'Exact 7 Investment Packages configured');
    assert(pkgRes.body.packages[0].amount === 10000 && pkgRes.body.packages[0].usdValue === 100, 'Starter Package: ₹10,000 ($100 USD)');
    assert(pkgRes.body.packages[1].amount === 50000 && pkgRes.body.packages[1].usdValue === 500, 'Basic Growth: ₹50,000 ($500 USD)');
    assert(pkgRes.body.packages[2].amount === 250000 && pkgRes.body.packages[2].usdValue === 2500, 'Pro Trader: ₹2,50,000 ($2,500 USD)');
    assert(pkgRes.body.packages[3].amount === 500000 && pkgRes.body.packages[3].usdValue === 5000, 'Premium Wealth: ₹5,00,000 ($5,000 USD)');
    assert(pkgRes.body.packages[4].amount === 1000000 && pkgRes.body.packages[4].usdValue === 10000, 'Elite Portfolio: ₹10,00,000 ($10,000 USD)');
    assert(pkgRes.body.packages[5].amount === 2500000 && pkgRes.body.packages[5].usdValue === 25000, 'Platinum Staking: ₹25,00,000 ($25,000 USD)');
    assert(pkgRes.body.packages[6].amount === 5000000 && pkgRes.body.packages[6].usdValue === 50000, 'VIP Unicorn: ₹50,00,000 ($50,000 USD)');

    // 7. Test Deposit Submission & Admin Compliance Approval Flow
    console.log('\n[Step 7] Testing Deposit Submission & Admin Approval Flow...');
    const depReq = {
      user: { _id: newUser.id, email: newUser.email, name: newUser.name },
      body: { amount: 100000, currency: 'INR', method: 'UPI', utrOrTxHash: 'UPI839102847192' }
    };
    const depRes = createMockRes();
    await walletController.submitDeposit(depReq, depRes);
    assert(depRes.statusCode === 201 && depRes.body.deposit.status === 'pending', 'Deposit request submitted with pending status');
    const depositId = depRes.body.deposit.id || depRes.body.deposit._id;

    // Admin approves deposit
    const appDepReq = { params: { depositId } };
    const appDepRes = createMockRes();
    await adminController.approveDeposit(appDepReq, appDepRes);
    assert(appDepRes.statusCode === 200 && appDepRes.body.success, 'Admin approved deposit');

    // Check user main wallet
    const updatedUserDoc = await DB.users.findById(newUser.id);
    assert(updatedUserDoc.mainWalletBalance === 100000, `User Main Wallet credited with ₹1,00,000 (Current: ₹${updatedUserDoc.mainWalletBalance})`);

    // 8. Test Package Investment & Bonus UNC Tokens
    console.log('\n[Step 8] Testing Package Activation (Basic Growth ₹50,000)...');
    const invReq = {
      user: { _id: newUser.id },
      body: { packageId: 'basic' }
    };
    const invRes = createMockRes();
    await investController.investPackage(invReq, invRes);
    assert(invRes.statusCode === 201 && invRes.body.success, 'Package activated successfully');
    assert(invRes.body.newBalances.main === 50000, `Main wallet debited ₹50,000 (Remaining: ₹${invRes.body.newBalances.main})`);
    assert(invRes.body.newBalances.activeInvested === 50000, 'Active invested balance set to ₹50,000');
    assert(invRes.body.newBalances.unc >= 5000, `Bonus UNC tokens credited (+${invRes.body.investment.bonusUnc} UNC)`);

    // 9. Test Daily 0.45% ROI Engine & Multi-Level Referral (ROI on ROI)
    console.log('\n[Step 9] Testing Daily 0.45% ROI Engine & Multi-Level ROI-on-ROI Distribution (Section 3)...');
    const roiCycleResult = await processDailyROI();
    assert(roiCycleResult.totalRoiDistributed > 0, `Distributed ₹${roiCycleResult.totalRoiDistributed.toLocaleString('en-IN')} in daily ROI`);
    
    // Check if new user received 0.45% ROI on ₹50,000 = ₹225
    const userAfterRoi = await DB.users.findById(newUser.id);
    assert(userAfterRoi.roiWalletBalance === 225, `User received exact 0.45% daily return (₹${userAfterRoi.roiWalletBalance})`);

    // 10. Test 2FA Security on Withdrawal (Section 6)
    console.log('\n[Step 10] Testing 2FA Security on Withdrawal (Section 6)...');
    // Step A: Request 2FA OTP
    const req2fa = { user: { _id: newUser.id } };
    const res2fa = createMockRes();
    await walletController.requestWithdrawal2FA(req2fa, res2fa);
    assert(res2fa.statusCode === 200 && res2fa.body.previewOtp, '2FA OTP generated for withdrawal');
    const validOtp = res2fa.body.previewOtp;

    // Step B: Submit withdrawal without valid OTP (Must fail)
    const badWithdrawReq = {
      user: { _id: newUser.id },
      body: {
        sourceWallet: 'roi',
        amount: 500,
        payoutMethod: 'bank',
        payoutDetails: { acc: '1234' },
        otpCode: '000000'
      }
    };
    const badWithdrawRes = createMockRes();
    await walletController.submitWithdrawal(badWithdrawReq, badWithdrawRes);
    assert(badWithdrawRes.statusCode === 400, 'Withdrawal with invalid 2FA code is rejected (Security enforced)');

    // 11. Test Internal Transfer (ROI Wallet -> Main Wallet)
    console.log('\n[Step 11] Testing Internal Zero-Fee Transfer (ROI -> Main Wallet)...');
    const transferReq = {
      user: { _id: newUser.id },
      body: { sourceWallet: 'roi', amount: 200 }
    };
    const transferRes = createMockRes();
    await walletController.transferToMainWallet(transferReq, transferRes);
    assert(transferRes.statusCode === 200 && transferRes.body.success, 'Internal transfer succeeded');
    const userAfterTransfer = await DB.users.findById(newUser.id);
    assert(userAfterTransfer.mainWalletBalance === 50200, `Main wallet updated to ₹${userAfterTransfer.mainWalletBalance}`);
    assert(userAfterTransfer.roiWalletBalance === 25, `ROI wallet debited to ₹${userAfterTransfer.roiWalletBalance}`);

    // 12. Test Referral Overview, Rank Rewards & Achiever Trips (Sections 4 & 5)
    console.log('\n[Step 12] Testing Referral Overview, Rank Progress (Section 4) & Achiever Trips (Section 5)...');
    const refReq = { user: { _id: newUser.id } };
    const refRes = createMockRes();
    await referralController.getReferralOverview(refReq, refRes);
    assert(refRes.statusCode === 200 && refRes.body.data, 'Referral data fetched');
    assert(refRes.body.data.rankProgress.length === 6, 'Rank rewards progress tracked across 6 tiers (₹2.5L to ₹1Cr)');
    assert(refRes.body.data.tripsProgress.length === 5, 'Achiever trips tracked across 5 tiers (Goa, Andaman, Thailand, Dubai, Europe)');

    // 13. Test Admin Metrics & Overview
    console.log('\n[Step 13] Testing Admin Platform Metrics & TVL Aggregation...');
    const adminMetricsRes = createMockRes();
    await adminController.getAdminMetrics({}, adminMetricsRes);
    assert(adminMetricsRes.statusCode === 200, 'Admin metrics aggregated successfully');
    assert(adminMetricsRes.body.metrics.totalUsers >= 2, `Total registered users: ${adminMetricsRes.body.metrics.totalUsers}`);
    assert(adminMetricsRes.body.metrics.activeStakedVolume > 0, `Total platform TVL tracked: ₹${adminMetricsRes.body.metrics.activeStakedVolume.toLocaleString('en-IN')}`);

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed === 0) {
    console.log('🎉 ALL BACKEND SYSTEMS & BUSINESS ENGINES ARE WORKING PERFECTLY!\n');
  }
}

runInProcessTests();
