const Investment = require('../models/Investment');
const User = require('../models/User');
const ledgerService = require('../services/ledgerService');
const { distributeRoiOnRoi } = require('../services/referralService');

/**
 * Idempotent Daily 0.45% ROI Engine & Multi-Level Referral Distribution
 */
async function runDailyRoiJob() {
  console.log(`[ROI Job] Starting daily ROI cycle at ${new Date().toISOString()}...`);

  // Find all confirmed active investments
  const activeInvestments = await Investment.find({ status: 'confirmed' });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if weekend pause is enabled (Monday to Friday trading days)
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;
  if (process.env.WEEKEND_PAUSE_ENABLED === 'true' && isWeekend) {
    console.log('[ROI Job] Weekend Pause active (Sat/Sun). Trading resumes Monday.');
    return { processedCount: 0, totalRoiPaid: 0, paused: true, reason: 'Weekend Pause' };
  }

  let totalRoiPaid = 0;
  let processedCount = 0;

  for (const inv of activeInvestments) {
    // Idempotency check: don't credit twice on the same calendar day
    if (inv.lastRoiCalculationDate) {
      const lastCalc = new Date(inv.lastRoiCalculationDate);
      lastCalc.setHours(0, 0, 0, 0);
      if (lastCalc.getTime() === today.getTime()) {
        continue; // Already processed today
      }
    }

    const user = await User.findById(inv.userId);
    if (!user || user.status !== 'active') continue;

    // Use precise integer arithmetic (no floating-point math): (Principal * 45) / 10000
    const calculationBase = Math.round(Number(inv.amount));
    const calculatedAmount = Math.floor((calculationBase * 45) / 10000);

    if (calculatedAmount <= 0) continue;

    // 1. Credit User's ROI Wallet through the ledger
    const { transaction } = await ledgerService.credit({
      userId: user._id,
      walletType: 'roi',
      amount: calculatedAmount,
      type: 'roi_credit',
      referenceId: String(inv._id),
      description: `Daily ROI (0.45%) · ${inv.packageName}`,
      subtitle: `Calculation base: ₹${calculationBase.toLocaleString('en-IN')}`
    });

    // 2. Update Investment tracking
    inv.lastRoiCalculationDate = new Date();
    inv.daysCredited += 1;
    inv.totalRoiEarned += calculatedAmount;
    await inv.save();

    totalRoiPaid += calculatedAmount;
    processedCount++;

    // 3. Trigger Multi-Level Referral Income (ROI on ROI)
    await distributeRoiOnRoi(user, calculatedAmount, inv._id);
  }

  console.log(`[ROI Job] Completed. Processed ${processedCount} investments. Total ROI: ₹${totalRoiPaid.toLocaleString('en-IN')}`);
  return { processedCount, totalRoiPaid };
}

module.exports = {
  runDailyRoiJob
};

