const User = require('../models/User');
const Referral = require('../models/Referral');
const ledgerService = require('./ledgerService');

// Configurable referral tier definitions per PDF Section 10
const REFERRAL_CONFIG = {
  tiers: [
    { level: 1, rate: 0.05, minDirects: 2, label: 'Level 1' },
    { levelRange: [2, 5], rate: 0.02, minDirects: 4, label: 'Levels 2–5' },
    { levelRange: [6, 10], rate: 0.01, minDirects: 7, label: 'Levels 6–10' },
    { levelRange: [11, 25], rate: 0.0025, minDirects: 12, label: 'Levels 11–25' },
    { levelRange: [26, 999], rate: 0.00125, minDirects: 15, label: 'Level 25+' }
  ]
};

/**
 * Returns applicable commission rate and eligibility rule for a given level
 */
function getTierRuleForLevel(level) {
  for (const t of REFERRAL_CONFIG.tiers) {
    if (t.level === level) return t;
    if (t.levelRange && level >= t.levelRange[0] && level <= t.levelRange[1]) {
      return t;
    }
  }
  return null;
}

/**
 * Counts verified active direct referrals for a user
 */
async function getDirectsCount(referralCode) {
  return await User.countDocuments({ referredBy: referralCode });
}

/**
 * Distributes multi-level ROI-on-ROI commissions to eligible uplines
 */
async function distributeRoiOnRoi(downlineUser, dailyRoiAmount, investmentId) {
  if (!downlineUser.referredBy || dailyRoiAmount <= 0) return [];

  const distributed = [];
  let currentSponsorCode = downlineUser.referredBy;
  let level = 1;

  while (currentSponsorCode && level <= 30) {
    const upline = await User.findOne({ referralCode: currentSponsorCode });
    if (!upline) break;

    const rule = getTierRuleForLevel(level);
    if (rule) {
      const directsCount = await getDirectsCount(upline.referralCode);

      // Check minimum direct referrals requirement
      if (directsCount >= rule.minDirects) {
        // Calculate ROI on ROI: percentage of the downline's daily ROI
        const commissionAmount = Math.round(dailyRoiAmount * rule.rate);

        if (commissionAmount > 0) {
          await ledgerService.credit({
            userId: upline._id,
            walletType: 'referral',
            amount: commissionAmount,
            type: 'referral_bonus',
            referenceId: String(investmentId),
            description: `Referral income · Level ${level} (${(rule.rate * 100).toFixed(2)}%)`,
            subtitle: `Downline ROI on ${downlineUser.name}`
          });

          distributed.push({
            uplineId: upline._id,
            level,
            rate: rule.rate,
            amount: commissionAmount
          });
        }
      }
    }

    currentSponsorCode = upline.referredBy;
    level++;
  }

  return distributed;
}

module.exports = {
  REFERRAL_CONFIG,
  getTierRuleForLevel,
  getDirectsCount,
  distributeRoiOnRoi
};

