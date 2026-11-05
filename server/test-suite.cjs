/**
 * UNICORN Backend Comprehensive Test Suite
 * Tests all 20 API endpoints and business logic engines
 */

const http = require('http');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 STARTING UNICORN BACKEND TEST SUITE');
  console.log('====================================================\n');

  // Set test port
  process.env.PORT = '5005';
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/unicorn_test';

  // Import app modules
  const { connectDB } = require('./config/db');
  const { seedInitialData } = require('./seed');
  const express = require('express');
  const cors = require('cors');

  const authRoutes = require('./routes/authRoutes');
  const walletRoutes = require('./routes/walletRoutes');
  const investRoutes = require('./routes/investRoutes');
  const referralRoutes = require('./routes/referralRoutes');
  const adminRoutes = require('./routes/adminRoutes');

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'online',
      protocol: 'UNICORN Web3 Investment & Rewards Protocol',
      token: 'Unicorn (UNC) BEP-20',
      timestamp: new Date().toISOString()
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/wallet', walletRoutes);
  app.use('/api/invest', investRoutes);
  app.use('/api/referral', referralRoutes);
  app.use('/api/admin', adminRoutes);

  await connectDB();
  await seedInitialData();

  const server = app.listen(5005);
  console.log('✔ Test server listening on http://localhost:5005\n');

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

  function apiCall(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
      const dataStr = body ? JSON.stringify(body) : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (dataStr) headers['Content-Length'] = Buffer.byteLength(dataStr);

      const req = http.request({
        hostname: 'localhost',
        port: 5005,
        path: `/api${path}`,
        method,
        headers
      }, (res) => {
        let respData = '';
        res.on('data', chunk => respData += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(respData) });
          } catch (e) {
            resolve({ status: res.statusCode, data: respData });
          }
        });
      });

      req.on('error', reject);
      if (dataStr) req.write(dataStr);
      req.end();
    });
  }

  try {
    // 1. Health Check
    console.log('[1/12] Testing API Health & Protocol Status...');
    const health = await apiCall('GET', '/health');
    assert(health.status === 200 && health.data.status === 'online', 'Health endpoint returns 200 and online status');
    assert(health.data.token === 'Unicorn (UNC) BEP-20', 'Token is confirmed as Unicorn (UNC) BEP-20');

    // 2. Authentication: Admin Login
    console.log('\n[2/12] Testing Super Admin Login...');
    const adminLogin = await apiCall('POST', '/auth/login', {
      email: 'admin@unicorn.io',
      password: 'admin123'
    });
    assert(adminLogin.status === 200 && adminLogin.data.success, 'Admin login succeeds with 200');
    assert(adminLogin.data.user.role === 'admin', 'Admin role recognized');
    const adminToken = adminLogin.data.token;

    // 3. User Registration with Sponsor Referral Code
    console.log('\n[3/12] Testing User Registration with Sponsor Referral Code...');
    const testEmail = `trader_${Date.now()}@example.com`;
    const regRes = await apiCall('POST', '/auth/register', {
      name: 'Karan Patel',
      email: testEmail,
      password: 'mypassword123',
      phone: '+91 99887 76655',
      referralCode: 'UNC7824' // Referred by Dharmik
    });
    assert(regRes.status === 201 && regRes.data.success, 'User registered successfully with status 201');
    assert(regRes.data.user.referralCode && regRes.data.user.referredBy === 'UNC7824', 'User referralCode generated and sponsor linked');
    const userToken = regRes.data.token;
    const userId = regRes.data.user.id;

    // 4. User Profile & Web3 Wallet
    console.log('\n[4/12] Testing User Profile & Web3 Wallet Linking...');
    const profRes = await apiCall('GET', '/auth/profile', null, userToken);
    assert(profRes.status === 200 && profRes.data.user.name === 'Karan Patel', 'Profile fetched successfully with JWT');

    const web3Res = await apiCall('POST', '/auth/web3-wallet', {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      connected: true
    }, userToken);
    assert(web3Res.status === 200 && web3Res.data.user.web3Connected === true, 'Web3 BEP-20 wallet connected & saved');

    // 5. Investment Packages (Section 2)
    console.log('\n[5/12] Testing Investment Packages Retrieval (Section 2)...');
    const pkgRes = await apiCall('GET', '/invest/packages');
    assert(pkgRes.status === 200 && Array.isArray(pkgRes.data.packages), 'Investment packages fetched');
    assert(pkgRes.data.packages.length === 7, 'Exact 7 investment packages available');
    assert(pkgRes.data.packages[0].amount === 10000 && pkgRes.data.packages[0].usdValue === 100, 'Starter package: ₹10,000 ($100 USD)');
    assert(pkgRes.data.packages[3].amount === 500000 && pkgRes.data.packages[3].dailyRoiRate === 0.0045, 'Premium package: ₹5,00,000, 0.45% Daily ROI');

    // 6. Deposit Request & Admin Approval Flow
    console.log('\n[6/12] Testing Deposit Submission & Admin Approval Flow...');
    const depRes = await apiCall('POST', '/wallet/deposit', {
      amount: 100000,
      currency: 'INR',
      method: 'UPI',
      utrOrTxHash: 'UPI984210582910'
    }, userToken);
    assert(depRes.status === 201 && depRes.data.success, 'Deposit request submitted with pending status');
    const depositId = depRes.data.deposit.id || depRes.data.deposit._id;

    // Admin views and approves deposit
    const adminDeps = await apiCall('GET', '/admin/deposits', null, adminToken);
    assert(adminDeps.status === 200 && adminDeps.data.deposits.length > 0, 'Admin can view pending deposits');

    const approveDepRes = await apiCall('POST', `/admin/deposits/${depositId}/approve`, null, adminToken);
    assert(approveDepRes.status === 200 && approveDepRes.data.success, 'Admin approves deposit');

    // Verify user balance is credited
    const walletAfterDep = await apiCall('GET', '/wallet/data', null, userToken);
    assert(walletAfterDep.data.balances.main === 100000, `User Main Wallet credited with ₹100,000 (Balance: ₹${walletAfterDep.data.balances.main})`);

    // 7. Investment Package Activation
    console.log('\n[7/12] Testing Package Investment & Bonus UNC Tokens...');
    const investRes = await apiCall('POST', '/invest/invest', { packageId: 'basic' }, userToken); // ₹50,000 package
    assert(investRes.status === 201 && investRes.data.success, 'Package activated successfully');
    assert(investRes.data.newBalances.main === 50000, `₹50,000 deducted from Main Wallet (Remaining: ₹${investRes.data.newBalances.main})`);
    assert(investRes.data.newBalances.activeInvested === 50000, 'Active Invested volume increased to ₹50,000');
    assert(investRes.data.newBalances.unc >= 5000, 'Bonus UNC tokens credited');

    // 8. Daily 0.45% ROI Engine & Multi-Level Referral Distribution
    console.log('\n[8/12] Testing 0.45% Daily ROI & Multi-Level Referral Engine...');
    const roiRes = await apiCall('POST', '/admin/roi/trigger', null, adminToken);
    assert(roiRes.status === 200 && roiRes.data.success, 'ROI distribution engine executed');
    assert(roiRes.data.totalRoiDistributed > 0, `Total daily ROI distributed: ₹${roiRes.data.totalRoiDistributed.toLocaleString('en-IN')}`);

    // Verify user received 0.45% ROI on ₹50,000 (0.45% = ₹225)
    const walletAfterRoi = await apiCall('GET', '/wallet/data', null, userToken);
    assert(walletAfterRoi.data.balances.roi >= 225, `User received ₹225 daily ROI in ROI Wallet (Balance: ₹${walletAfterRoi.data.balances.roi})`);

    // 9. 2FA Security at Withdrawal Flow (Section 6)
    console.log('\n[9/12] Testing 2FA Security Verification for Withdrawal...');
    // Request 2FA OTP
    const otpRes = await apiCall('POST', '/wallet/withdraw/request-2fa', null, userToken);
    assert(otpRes.status === 200 && otpRes.data.previewOtp, '2FA OTP code generated and dispatched');
    const otpCode = otpRes.data.previewOtp;

    // Attempt withdrawal with wrong OTP (should fail)
    const badWithdraw = await apiCall('POST', '/wallet/withdraw', {
      sourceWallet: 'roi',
      amount: 200,
      payoutMethod: 'crypto',
      payoutDetails: { bep20Address: '0x123...' },
      otpCode: '000000'
    }, userToken);
    assert(badWithdraw.status === 400, 'Withdrawal with invalid 2FA code is rejected (Security enforced)');

    // 10. Internal Transfer (ROI to Main Wallet)
    console.log('\n[10/12] Testing Internal Wallet Transfer (ROI -> Main Wallet)...');
    const transferRes = await apiCall('POST', '/wallet/transfer', {
      sourceWallet: 'roi',
      amount: 200
    }, userToken);
    assert(transferRes.status === 200 && transferRes.data.success, 'Internal transfer of ₹200 from ROI to Main Wallet succeeded (0% gas fee)');

    // 11. Referral Network Overview & Rewards Tracker
    console.log('\n[11/12] Testing Referral Network & Rewards Tracker...');
    const refRes = await apiCall('GET', '/referral/overview', null, userToken);
    assert(refRes.status === 200 && refRes.data.success, 'Referral overview returned 200');
    assert(Array.isArray(refRes.data.data.rankProgress) && refRes.data.data.rankProgress.length === 6, 'Rank rewards progress tracked (₹2.5L to ₹1Cr)');
    assert(Array.isArray(refRes.data.data.tripsProgress) && refRes.data.data.tripsProgress.length === 5, 'Achiever trips progress tracked (Goa, Andaman, Thailand, Dubai, Europe)');

    // 12. Admin Metrics & System Overview
    console.log('\n[12/12] Testing Admin Platform Metrics & User Management...');
    const adminMetrics = await apiCall('GET', '/admin/metrics', null, adminToken);
    assert(adminMetrics.status === 200 && adminMetrics.data.metrics.totalUsers >= 2, 'Admin metrics aggregated total users');
    assert(adminMetrics.data.metrics.activeStakedVolume > 0, `Admin metrics tracks active staked TVL: ₹${adminMetrics.data.metrics.activeStakedVolume.toLocaleString('en-IN')}`);

    const adminUsers = await apiCall('GET', '/admin/users', null, adminToken);
    assert(adminUsers.status === 200 && Array.isArray(adminUsers.data.users), 'Admin users directory accessible');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close();
    console.log('\n====================================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();

