const Investment = require('../models/Investment');
const ledgerService = require('../services/ledgerService');

/**
 * Maturity Job
 * Checks active investments that have completed their maturity period (e.g. 365 days)
 * Automatically marks them as MATURED, unlocks capital, and refunds principal to MAIN Wallet
 */
async function runMaturityJob() {
  console.log(`[Maturity Job] Checking for matured investments at ${new Date().toISOString()}...`);
  const now = new Date();

  const maturedInvestments = await Investment.find({
    status: { $in: ['confirmed', 'CONFIRMED', 'ACTIVE', 'active'] },
    isLocked: true,
    maturityDate: { $lte: now }
  });

  let unlockedCount = 0;

  for (const inv of maturedInvestments) {
    try {
      // 1. Mark investment matured and unlocked
      inv.status = 'MATURED';
      inv.isLocked = false;
      await inv.save();

      // 2. Atomically refund capital back to MAIN Wallet through ledger
      await ledgerService.credit({
        userId: inv.userId,
        walletType: 'main',
        amount: inv.amount,
        type: 'refund',
        referenceId: String(inv._id),
        description: `Staking Maturity Principal Unlock · ${inv.packageName}`,
        subtitle: `Matured on ${now.toLocaleDateString('en-IN')}`
      });

      unlockedCount++;
    } catch (err) {
      console.error(`[Maturity Job] Error processing investment ${inv._id}:`, err.message);
    }
  }

  console.log(`[Maturity Job] Completed. Unlocked capital for ${unlockedCount} matured stakes.`);
  return { unlockedCount };
}

module.exports = {
  runMaturityJob
};

