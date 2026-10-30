const User = require('../models/User');
const Reward = require('../models/Reward');
const ledgerService = require('../services/ledgerService');
const { RANK_TARGETS, getUserBusinessVolumes } = require('../services/rewardService');

/**
 * Periodically evaluate all users for Rank Rewards
 */
async function runRankJob() {
  console.log(`[Rank Job] Starting Rank Reward evaluation at ${new Date().toISOString()}...`);
  const users = await User.find({ status: 'active' });
  let rewardedCount = 0;

  for (const user of users) {
    try {
      const { totalBusiness } = await getUserBusinessVolumes(user._id, user.referralCode);
      const existingRewards = await Reward.find({ userId: user._id, type: 'rank_bonus' });
      const achievedTargets = existingRewards.map(r => r.targetVolume);

      for (const rank of RANK_TARGETS) {
        if (totalBusiness >= rank.target && !achievedTargets.includes(rank.target)) {
          // Calculate bonus: fixed or percentage
          let bonus = rank.bonus;
          if (!bonus && rank.calculationBase === 'TOTAL_BUSINESS') {
            bonus = Math.round(totalBusiness * 0.03); // 3% for 1 Cr
          }

          // Credit to user's main wallet
          await ledgerService.credit({
            userId: user._id,
            walletType: 'main',
            amount: bonus,
            type: 'rank_reward',
            description: `Rank Reward: ${rank.rank}`,
            subtitle: `Target achieved: ₹${rank.target.toLocaleString('en-IN')}`
          });

          // Record reward
          await Reward.create({
            userId: user._id,
            type: 'rank_bonus',
            rewardName: rank.rank,
            targetVolume: rank.target,
            bonusAmount: bonus,
            status: 'claimed'
          });

          // Update user's title
          user.rank = rank.rank;
          await user.save();
          rewardedCount++;
        }
      }
    } catch (err) {
      console.error(`[Rank Job] Error evaluating user ${user._id}:`, err.message);
    }
  }

  console.log(`[Rank Job] Completed. Awarded rank bonuses to ${rewardedCount} milestones.`);
  return { rewardedCount };
}

module.exports = {
  runRankJob
};

