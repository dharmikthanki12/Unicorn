const Investment = require('../models/Investment');
const User = require('../models/User');
const PlatformSettings = require('../models/PlatformSettings');
const ledgerService = require('../services/ledgerService');
const { distributeRoiOnRoi } = require('../services/referralService');

/**
 * Pure Mathematical ROI Calculation Functions
 * Confirmed Business Rules:
 * Daily ROI: 0.45% of eligible investment principal (Simple Interest, no compounding)
 * Monthly Calculation: 22 earning days (Daily ROI * 22)
 * Saturday: No ROI
 * Sunday: No ROI
 */
function calculateDailyRoi(principal) {
  const base = Math.round(Number(principal) || 0);
  return Math.floor((base * 45) / 10000);
}

function calculateMonthlyRoi(principal, earningDays = 22) {
  return calculateDailyRoi(principal) * earningDays;
}

/**
 * Idempotent Daily 0.45% ROI Engine & Multi-Level Referral Distribution
 * Runs once per eligible earning day (Monday to Friday).
 * Strictly skips Saturdays and Sundays.
 * Supports configurable public holidays, investment durations, and idempotency.
 */
async function runDailyRoiJob(options = {}) {
  const today = options.targetDate ? new Date(options.targetDate) : new Date();
  today.setHours(0, 0, 0, 0);

  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  console.log(`[ROI Job] Running daily ROI cycle for ${today.toISOString().split('T')[0]} (Day ${dayOfWeek})...`);

  // 1. Strict Weekend Pause Rule (No ROI on Saturday or Sunday)
  if (isWeekend && !options.forceRun) {
    const dayName = dayOfWeek === 0 ? 'Sunday' : 'Saturday';
    console.log(`[ROI Job] Weekend pause active: ${dayName} - No ROI generated. Trading resumes Monday.`);
    return {
      processedCount: 0,
      totalRoiPaid: 0,
      paused: true,
      reason: `Weekend Pause: Saturday and Sunday earn no ROI.`
    };
  }

  // 2. Configurable Public Holidays Check
  const dateStr = today.toISOString().split('T')[0];
  const envHolidays = (process.env.PUBLIC_HOLIDAYS || '').split(',').map(s => s.trim()).filter(Boolean);
  
  let settings = null;
  try {
    settings = await PlatformSettings.findOne({ isCurrent: true }).lean();
  } catch (e) {
    // PlatformSettings fallback
  }

  const configuredHolidays = (settings && Array.isArray(settings.publicHolidays))
    ? settings.publicHolidays
    : envHolidays;

  if (configuredHolidays.includes(dateStr) && !options.forceRun) {
    console.log(`[ROI Job] Configured public holiday active for ${dateStr}. No ROI generated.`);
    return {
      processedCount: 0,
      totalRoiPaid: 0,
      paused: true,
      reason: `Public Holiday: ${dateStr}`
    };
  }

  // 3. Find all confirmed active and eligible investments
  const activeInvestments = await Investment.find({
    status: { $in: ['confirmed', 'ACTIVE', 'confirmed'] },
    eligibilityStatus: { $ne: 'PAUSED' }
  });

  let totalRoiPaid = 0;
  let processedCount = 0;
  const processedInvestments = [];

  for (const inv of activeInvestments) {
    // Eligibility & Duration validation
    const maxDuration = inv.durationDays || (settings ? settings.roiDurationDays : null);
    if (maxDuration && inv.daysCredited >= maxDuration) {
      inv.status = 'COMPLETED';
      inv.eligibilityStatus = 'COMPLETED';
      await inv.save();
      continue;
    }

    // Idempotency check: prevent duplicate daily ROI entries for the same calendar date
    if (inv.lastRoiCalculationDate) {
      const lastCalc = new Date(inv.lastRoiCalculationDate);
      lastCalc.setHours(0, 0, 0, 0);
      if (lastCalc.getTime() === today.getTime() && !options.forceRun) {
        continue; // Already processed today
      }
    }

    const user = await User.findById(inv.userId);
    if (!user || user.status !== 'active') continue;

    // Daily ROI = Eligible Investment Principal * 0.0045 (Simple ROI, not compounding)
    const calculationBase = Math.round(Number(inv.amount));
    const calculatedAmount = calculateDailyRoi(calculationBase);

    if (calculatedAmount <= 0) continue;

    // 1. Auditable ledger credit to ROI Wallet
    await ledgerService.credit({
      userId: user._id,
      walletType: 'roi',
      amount: calculatedAmount,
      type: 'roi_credit',
      referenceId: String(inv._id),
      description: `Daily ROI (0.45%) · ${inv.packageName}`,
      subtitle: `Calculation Base: ₹${calculationBase.toLocaleString('en-IN')} (Day ${inv.daysCredited + 1})`
    });

    // 2. Update Investment tracking
    inv.lastRoiCalculationDate = today;
    inv.daysCredited += 1;
    inv.totalRoiEarned = (inv.totalRoiEarned || 0) + calculatedAmount;
    inv.totalRoiCredited = (inv.totalRoiCredited || 0) + calculatedAmount;

    if (maxDuration && inv.daysCredited >= maxDuration) {
      inv.status = 'COMPLETED';
      inv.eligibilityStatus = 'COMPLETED';
    }

    await inv.save();

    totalRoiPaid += calculatedAmount;
    processedCount++;
    processedInvestments.push({
      investmentId: inv._id,
      userId: user._id,
      principal: calculationBase,
      dailyRoi: calculatedAmount,
      day: inv.daysCredited
    });

    // 3. Referral commissions calculated from eligible ROI, not original investment principal
    try {
      await distributeRoiOnRoi(user, calculatedAmount, inv._id);
    } catch (refErr) {
      console.warn(`[ROI Job] Referral distribution notice for user ${user._id}:`, refErr.message);
    }
  }

  console.log(`[ROI Job] Completed. Processed ${processedCount} investments. Total ROI: ₹${totalRoiPaid.toLocaleString('en-IN')}`);

  return {
    success: true,
    processedCount,
    totalRoiPaid,
    date: dateStr,
    processedInvestments
  };
}

module.exports = {
  runDailyRoiJob,
  calculateDailyRoi,
  calculateMonthlyRoi
};
