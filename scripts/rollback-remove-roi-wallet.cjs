/**
 * UNICORN Rollback Script: Reverse ROI Wallet Migration
 * Restores legacy ROI wallets from audit snapshots within the 7-day rollback window.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const mongoose = require('mongoose');

async function runRollback() {
  const args = process.argv.slice(2);
  let targetRunId = null;

  for (const arg of args) {
    if (arg.startsWith('--runId=')) {
      targetRunId = arg.split('=')[1];
    } else if (arg === '--latest') {
      targetRunId = 'LATEST';
    }
  }

  if (!targetRunId) {
    console.error('[rollback] Usage: node scripts/rollback-remove-roi-wallet.cjs --runId=<id> OR --latest');
    process.exit(1);
  }

  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unicorn';
  await mongoose.connect(mongoURI);

  const db = mongoose.connection.db;
  const walletsCol = db.collection('wallets');
  const snapshotCol = db.collection('wallet_migration_snapshots');

  if (targetRunId === 'LATEST') {
    const latestDoc = await snapshotCol.find().sort({ createdAt: -1 }).limit(1).toArray();
    if (latestDoc.length === 0) {
      console.error('[rollback] No snapshots found in wallet_migration_snapshots.');
      await mongoose.disconnect();
      process.exit(1);
    }
    targetRunId = latestDoc[0].runId;
  }

  console.log(`[rollback] Investigating snapshots for runId=${targetRunId}`);

  const snapshots = await snapshotCol.find({ runId: targetRunId }).toArray();
  if (snapshots.length === 0) {
    console.error(`[rollback] No snapshots found matching runId=${targetRunId}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  // 7-day window verification
  const now = new Date();
  const validSnapshots = snapshots.filter(s => new Date(s.expiresAt) > now);
  if (validSnapshots.length === 0) {
    console.error('[rollback] FATAL: Snapshots exceed 7-day window. Rollback window has expired.');
    await mongoose.disconnect();
    process.exit(1);
  }

  let restoredCount = 0;
  let alreadyPresentCount = 0;
  let failedCount = 0;

  for (const s of validSnapshots) {
    try {
      const { userId, roiSnapshot } = s;
      const roiAmount = Number(roiSnapshot.balanceINR || roiSnapshot.balance || 0);

      // Check if ROI wallet already exists
      const existing = await walletsCol.findOne({
        userId,
        type: { $in: ['roi', 'ROI'] }
      });

      if (existing) {
        alreadyPresentCount++;
        continue;
      }

      // Re-insert original ROI wallet
      await walletsCol.insertOne(roiSnapshot);

      // Reverse merge on MAIN wallet
      if (roiAmount > 0) {
        await walletsCol.updateOne(
          { userId, type: { $in: ['MAIN', 'main'] } },
          { $inc: { balanceINR: -roiAmount } }
        );
      }

      restoredCount++;
    } catch (err) {
      failedCount++;
      console.error(`[rollback] Failed for snapshot user=${s.userId}: ${err.message}`);
    }
  }

  console.log(`[rollback] runId=${targetRunId} restored=${restoredCount} alreadyPresent=${alreadyPresentCount} failed=${failedCount}`);

  await mongoose.disconnect();

  if (failedCount > 0) {
    console.error(`[rollback] Terminated with ${failedCount} errors.`);
    process.exit(1);
  }

  process.exit(0);
}

runRollback().catch(err => {
  console.error('[rollback] FATAL ERROR:', err.message);
  process.exit(1);
});
