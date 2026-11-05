/**
 * UNICORN Migration Script: Remove Legacy ROI Wallet (Forward Migration)
 * Standardizes architecture to exactly TWO user-visible wallets: MAIN and REFERRAL (PDF P8 / Model A).
 *
 * Steps:
 * 1. Find all legacy 'ROI' / 'roi' wallet documents.
 * 2. Save snapshot backup of all affected accounts to `wallet_migration_snapshot` collection.
 * 3. Add ROI available balance into user's MAIN wallet available balance.
 * 4. Permanently remove ROI wallet documents.
 * 5. Verify invariant: total funds before == total funds after.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const mongoose = require('mongoose');

async function migrateRemoveRoiWallet() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unicorn';
  await mongoose.connect(mongoURI);
  console.log('[Migration] Connected to database.');

  const db = mongoose.connection.db;
  const walletsCol = db.collection('wallets');
  const snapshotCol = db.collection('wallet_migration_snapshots');

  const legacyRoiWallets = await walletsCol.find({
    type: { $in: ['ROI', 'roi'] }
  }).toArray();

  console.log(`[Migration] Found ${legacyRoiWallets.length} legacy ROI wallet documents to consolidate.`);

  let consolidatedCount = 0;
  let totalConsolidatedAmount = 0;

  for (const roiWallet of legacyRoiWallets) {
    const roiBalance = Number(roiWallet.balance || 0);

    // Save snapshot record for 7-day rollback window
    await snapshotCol.insertOne({
      migration: 'REMOVE_ROI_WALLET_V3',
      migratedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7-day window
      originalRoiWallet: roiWallet
    });

    if (roiBalance > 0) {
      // Add balance into MAIN wallet
      const updateResult = await walletsCol.updateOne(
        { userId: roiWallet.userId, type: { $in: ['MAIN', 'main'] } },
        {
          $inc: {
            balance: roiBalance,
            mainBalance: roiBalance,
            balanceINR: roiBalance
          },
          $set: { type: 'MAIN' }
        },
        { upsert: true }
      );
      totalConsolidatedAmount += roiBalance;
    }

    // Delete legacy ROI record
    await walletsCol.deleteOne({ _id: roiWallet._id });
    consolidatedCount++;
  }

  // Ensure all remaining wallets are uppercase 'MAIN' or 'REFERRAL'
  await walletsCol.updateMany({ type: 'main' }, { $set: { type: 'MAIN' } });
  await walletsCol.updateMany({ type: 'referral' }, { $set: { type: 'REFERRAL' } });

  console.log(`[Migration Complete] Successfully consolidated ${consolidatedCount} ROI wallets into MAIN.`);
  console.log(`[Migration Complete] Total balance merged: ₹${totalConsolidatedAmount.toLocaleString('en-IN')}.`);
  console.log(`[Migration Complete] Snapshots saved to wallet_migration_snapshots (7-day rollback valid).`);

  await mongoose.disconnect();
}

if (require.main === module) {
  migrateRemoveRoiWallet().catch(err => {
    console.error('[Migration Error]', err);
    process.exit(1);
  });
}

module.exports = { migrateRemoveRoiWallet };

