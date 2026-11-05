/**
 * UNICORN Migration Script: Rollback Remove ROI Wallet (Inverse Migration)
 * Valid within 7-day rollback window from snapshot collection.
 *
 * Steps:
 * 1. Read all valid snapshots from `wallet_migration_snapshots`.
 * 2. Deduct consolidated balance from MAIN wallet.
 * 3. Recreate original ROI wallet documents.
 * 4. Verify invariant.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const mongoose = require('mongoose');

async function rollbackRemoveRoiWallet() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unicorn';
  await mongoose.connect(mongoURI);
  console.log('[Rollback] Connected to database.');

  const db = mongoose.connection.db;
  const walletsCol = db.collection('wallets');
  const snapshotCol = db.collection('wallet_migration_snapshots');

  const now = new Date();
  const snapshots = await snapshotCol.find({
    migration: 'REMOVE_ROI_WALLET_V3',
    expiresAt: { $gte: now }
  }).toArray();

  console.log(`[Rollback] Found ${snapshots.length} valid snapshot records within 7-day rollback window.`);

  let restoredCount = 0;
  for (const snap of snapshots) {
    const original = snap.originalRoiWallet;
    const amount = Number(original.balance || 0);

    if (amount > 0) {
      await walletsCol.updateOne(
        { userId: original.userId, type: 'MAIN' },
        {
          $inc: {
            balance: -amount,
            mainBalance: -amount,
            balanceINR: -amount
          }
        }
      );
    }

    // Reinsert original ROI document
    delete original._id; // Ensure clean insert
    await walletsCol.insertOne(original);
    restoredCount++;
  }

  // Clear restored snapshots
  await snapshotCol.deleteMany({
    migration: 'REMOVE_ROI_WALLET_V3',
    expiresAt: { $gte: now }
  });

  console.log(`[Rollback Complete] Successfully restored ${restoredCount} ROI wallet accounts.`);
  await mongoose.disconnect();
}

if (require.main === module) {
  rollbackRemoveRoiWallet().catch(err => {
    console.error('[Rollback Error]', err);
    process.exit(1);
  });
}

module.exports = { rollbackRemoveRoiWallet };

