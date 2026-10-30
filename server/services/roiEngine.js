const { DB } = require('../models');
const { DAILY_ROI_RATE, REFERRAL_TIERS } = require('../config/constants');
const { checkRankAndAchieverRewards } = require('./rankRewardEngine');

/**
 * Calculates and distributes:
 * 1. Daily ROI (0.45%) to all active package holders.
 * 2. Multi-level Referral Income (ROI on ROI) to eligible uplines.
 */
async function processDailyROI() {
  console.log(`[ROI Engine] Starting Daily ROI & Referral distribution at ${new Date().toISOString()}...`);

  const activeInvestments = await DB.investments.find({ status: 'active' });
  let totalRoiDistributed = 0;
  let totalReferralDistributed = 0;

  for (const inv of activeInvestments) {
    const user = await DB.users.findById(inv.userId);
    if (!user) continue;

    // Calculate daily ROI (0.45% of package investment)
    const roiAmount = Math.round(Number(inv.amount) * DAILY_ROI_RATE);
    if (roiAmount <= 0) continue;

    // 1. Credit Daily ROI to User's ROI Wallet
    await DB.users.updateOne(
      { _id: user._id },
      {
        $inc: {
          roiWalletBalance: roiAmount,
          todayRoiIncome: roiAmount
        }
      }
    );

    // Record Transaction in Ledger
    await DB.transactions.create({
      userId: user._id,
      type: 'roi',
      amount: roiAmount,
      amountFormatted: `+₹${roiAmount.toLocaleString('en-IN')}`,
      title: `ROI income · Daily 0.45%`,
      subtitle: `${inv.packageName} (Tier ${inv.tier})`,
      status: 'completed'
    });

    totalRoiDistributed += roiAmount;

    // 2. Distribute Multi-level Referral Income (ROI on ROI) up to 25+ levels
    let currentSponsorCode = user.referredBy;
    let level = 1;

    while (currentSponsorCode && level <= 30) {
      const uplineUser = await DB.users.findOne({ referralCode: currentSponsorCode });
      if (!uplineUser) break;

      // Determine rate and eligibility based on PDF Section 3
      let rate = 0;
      let minDirectsRequired = 0;

      if (level === 1) {
        rate = 0.05; // 5%
        minDirectsRequired = 2;
      } else if (level >= 2 && level <= 5) {
        rate = 0.02; // 2%
        minDirectsRequired = 4;
      } else if (level >= 6 && level <= 10) {
        rate = 0.01; // 1%
        minDirectsRequired = 7;
      } else if (level >= 11 && level <= 25) {
        rate = 0.0025; // 0.25%
        minDirectsRequired = 12;
      } else {
        rate = 0.00125; // 0.125% for Level 25+
        minDirectsRequired = 15;
      }

      // Check eligibility: upline must have the required number of direct referrals
      const uplineDirectsCount = Number(uplineUser.directsCount || 0);
      if (uplineDirectsCount >= minDirectsRequired) {
        // Referral income is calculated as % of downline's ROI (ROI on ROI)
        const refEarnings = Math.round(roiAmount * rate);

        if (refEarnings > 0) {
          await DB.users.updateOne(
            { _id: uplineUser._id },
            {
              $inc: {
                referralWalletBalance: refEarnings,
                todayReferralIncome: refEarnings
              }
            }
          );

          await DB.transactions.create({
            userId: uplineUser._id,
            type: 'referral',
            amount: refEarnings,
            amountFormatted: `+₹${refEarnings.toLocaleString('en-IN')}`,
            title: `Referral income · Level ${level} (${(rate * 100).toFixed(2)}%)`,
            subtitle: `Downline ROI on ${user.name || 'Member'}`,
            status: 'completed'
          });

          totalReferralDistributed += refEarnings;
        }
      }

      // Move up to the next parent in the genealogy tree
      currentSponsorCode = uplineUser.referredBy;
      level++;
    }
  }

  console.log(`[ROI Engine] Completed. Total ROI: ₹${totalRoiDistributed.toLocaleString('en-IN')}, Total Referral: ₹${totalReferralDistributed.toLocaleString('en-IN')}`);
  return { totalRoiDistributed, totalReferralDistributed };
}

module.exports = {
  processDailyROI
};
