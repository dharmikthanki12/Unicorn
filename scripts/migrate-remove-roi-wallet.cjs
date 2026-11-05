/**
 * UNICORN Forward Migration Script: Remove Legacy ROI Wallet
 * Architecture Standard: Exactly TWO user-visible wallets per user: MAIN and REFERRAL (Model A & B7/B9).
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const mongoose = require('mongoose');
const crypto = require('crypto');

async function runMigration() {
  const isDryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
  const runId = crypto.randomBytes(8).toString('hex');
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unicorn';

  console.log(`[migrate] START runId=${runId} dryRun=${isDryRun}`);
  await mongoose.connect(mongoURI);

  const db = mongoose.connection.db;
  const walletsCol = db.collection('wallets');
  const snapshotCol = db.collection('wallet_migration_snapshots');

  // Query legacy ROI wallets
  const legacyRoiWallets = await walletsCol.find({
    type: { $in: ['roi', 'ROI'] }
  }).toArray();

  console.log(`[migrate] runId=${runId} found=${legacyRoiWallets.length} legacy ROI wallets`);

  const BATCH_SIZE = 500;
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < legacyRoiWallets.length; i += BATCH_SIZE) {
    const batch = legacyRoiWallets.slice(i, i + BATCH_SIZE);

    for (const roiWallet of batch) {
      try {
        const userId = roiWallet.userId;
        const roiBalance = Number(roiWallet.balanceINR || roiWallet.balance || 0);

        // Fetch current main wallet for snapshot
        const mainWallet = await walletsCol.findOne({
          userId,
          type: { $in: ['MAIN', 'main'] }
        });

        const createdAt = new Date();
        const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Record audit snapshot
        await snapshotCol.insertOne({
          runId,
          userId,
          roiSnapshot: roiWallet,
          mainSnapshot: mainWallet || null,
          createdAt,
          expiresAt
        });

        if (isDryRun) {
          console.log(`[migrate] DRY_RUN runId=${runId} user=${userId} roiAmount=${roiBalance}`);
          continue;
        }

        // Merge balance into MAIN wallet balanceINR
        if (roiBalance > 0) {
          await walletsCol.updateOne(
            { userId, type: { $in: ['MAIN', 'main'] } },
            {
              $inc: { balanceINR: roiBalance },
              $set: { type: 'MAIN' }
            },
            { upsert: true }
          );
        }

        // Delete legacy ROI wallet document
        await walletsCol.deleteOne({ _id: roiWallet._id });
        successCount++;
        console.log(`[migrate] runId=${runId} user=${userId} merged=${roiBalance} status=SUCCESS`);
      } catch (err) {
        failedCount++;
        console.error(`[migrate] runId=${runId} user=${roiWallet.userId} failed=1 err=${err.message}`);
      }
    }
  }

  // Standardize remaining wallet types: main -> MAIN, referral -> REFERRAL
  if (!isDryRun) {
    await walletsCol.updateMany({ type: 'main' }, { $set: { type: 'MAIN' } });
    await walletsCol.updateMany({ type: 'referral' }, { $set: { type: 'REFERRAL' } });
  }

  // Final Audit: Count remaining legacy ROI wallets
  const remainingCount = await walletsCol.countDocuments({
    type: { $in: ['roi', 'ROI'] }
  });

  console.log(`[migrate] COMPLETED runId=${runId} processed=${successCount} failed=${failedCount} remaining=${remainingCount}`);

  await mongoose.disconnect();

  if (!isDryRun && remainingCount > 0) {
    console.error(`[migrate] FATAL: Audit failed. ${remainingCount} ROI wallets still remain.`);
    process.exit(1);
  }

  process.exit(0);
}

runMigration().catch(err => {
  console.error('[migrate] FATAL ERROR:', err.message);
  process.exit(1);
});
