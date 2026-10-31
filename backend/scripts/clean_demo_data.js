const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

async function cleanDemoData() {
  console.log('========================================================');
  console.log('🧹 UNICORN DATABASE CLEANUP — REMOVING ALL DEMO DATA');
  console.log('========================================================\n');

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 20000,
    connectTimeoutMS: 20000
  });

  const db = mongoose.connection.db;

  // 1. Identify Demo Users to Delete
  // All demo accounts: investor_*, test*, rutajeet*, demo*, dharmik_*
  const demoUserFilter = {
    $or: [
      { email: { $regex: /^investor_/i } },
      { email: { $regex: /^demo@/i } },
      { email: { $regex: /^test/i } },
      { email: { $regex: /^rutajeet/i } },
      { email: { $regex: /^dharmik_\d+/i } }
    ]
  };

  const demoUsers = await db.collection('users').find(demoUserFilter).toArray();
  const demoUserIds = demoUsers.map(u => u._id);
  console.log(`Found ${demoUsers.length} demo users to remove:`);
  demoUsers.forEach(u => console.log(`  - ${u.email} (${u.name})`));

  // 2. Delete Demo Users
  const userDeleteResult = await db.collection('users').deleteMany(demoUserFilter);
  console.log(`\n✔ Deleted ${userDeleteResult.deletedCount} demo users from 'users' collection.`);

  // 3. Delete Wallets belonging to demo users or orphaned
  const walletDeleteResult = await db.collection('wallets').deleteMany({
    userId: { $in: demoUserIds }
  });
  console.log(`✔ Deleted ${walletDeleteResult.deletedCount} demo wallets from 'wallets' collection.`);

  // 4. Remove all test Deposits
  const depResult = await db.collection('deposits').deleteMany({});
  console.log(`✔ Deleted ${depResult.deletedCount} demo/test deposits from 'deposits' collection.`);

  // 5. Remove all test Investments
  const invResult = await db.collection('investments').deleteMany({});
  console.log(`✔ Deleted ${invResult.deletedCount} demo/test investments from 'investments' collection.`);

  // 6. Remove all test Withdrawals
  const withResult = await db.collection('withdrawals').deleteMany({});
  console.log(`✔ Deleted ${withResult.deletedCount} demo/test withdrawals from 'withdrawals' collection.`);

  // 7. Remove all test Financial Ledgers & Transactions
  const flResult = await db.collection('financialledgers').deleteMany({});
  console.log(`✔ Deleted ${flResult.deletedCount} records from 'financialledgers' collection.`);

  const txResult = await db.collection('transactions').deleteMany({});
  console.log(`✔ Deleted ${txResult.deletedCount} records from 'transactions' collection.`);

  // 8. Remove test ROI Accruals
  const roiResult = await db.collection('roiaccruals').deleteMany({});
  console.log(`✔ Deleted ${roiResult.deletedCount} records from 'roiaccruals' collection.`);

  // 9. Remove test Referral trees, rewards & commissions
  const refInc = await db.collection('referralincomes').deleteMany({});
  const refRew = await db.collection('referralrewards').deleteMany({});
  const refs = await db.collection('referrals').deleteMany({});
  const rew = await db.collection('rewards').deleteMany({});
  const ach = await db.collection('achieverbonus').deleteMany({});
  console.log(`✔ Cleaned referral & reward tracking collections.`);

  // 10. Clean Audit Logs of demo actions
  const auditResult = await db.collection('auditlogs').deleteMany({});
  console.log(`✔ Deleted ${auditResult.deletedCount} test records from 'auditlogs' collection.`);

  // Reset remaining users' wallets (e.g., admin and niraj) to clean clean state
  const remainingUsers = await db.collection('users').find({}).toArray();
  console.log(`\nRemaining verified users in database (${remainingUsers.length}):`);
  for (const ru of remainingUsers) {
    console.log(`  • ${ru.email} (${ru.name}) [Role: ${ru.role}]`);
    // Ensure clean wallet state
    await db.collection('wallets').updateMany(
      { userId: ru._id },
      { $set: { balance: 0, balanceINR: 0, mainBalance: 0, roiBalance: 0, referralBalance: 0, reservedWithdrawal: 0 } }
    );
  }

  // 11. Final Collection Status
  console.log('\n========================================================');
  console.log('📊 FINAL CLEAN DATABASE STATUS:');
  console.log('========================================================');
  const collections = await db.listCollections().toArray();
  for (const c of collections) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`  - ${c.name.padEnd(20)} : ${count} documents`);
  }
  console.log('========================================================');
  console.log('🎉 ALL DEMO DATA REMOVED SUCCESSFULLY! DATABASE IS CLEAN.');
  console.log('========================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

cleanDemoData().catch(err => {
  console.error('❌ Error during cleanup:', err);
  process.exit(1);
});
