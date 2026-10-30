const Reward = require('../models/Reward');
const User = require('../models/User');
const Investment = require('../models/Investment');
const ledgerService = require('./ledgerService');

const RANK_TARGETS = [
  { target: 250000, bonus: 5000, rankName: 'Bronze Leader' },
  { target: 500000, bonus: 11000, rankName: 'Silver Star' },
  { target: 1000000, bonus: 20000, rankName: 'Gold Executive' },
  { target: 2500000, bonus: 45000, rankName: 'Diamond Director' },
  { target: 5000000, bonus: 100000, rankName: 'Crown Ambassador' },
  { target: 10000000, bonusRate: 0.03, fixedBonus: 300000, rankName: 'Unicorn Legend' }
];

const ACHIEVER_TRIPS = [
  { target: 500000, trip: 'Goa Trip' },
  { target: 1500000, trip: 'Andaman Trip' },
  { target: 3000000, trip: 'Thailand Trip' },
  { target: 5000000, trip: 'Dubai Trip' },
  { target: 10000000, trip: 'Europe Trip' }
];

/**
 * Calculates direct volume and team volume for a user
 */
async function getUserBusinessVolumes(userId, userReferralCode) {
  // Personal active investments
  const personalInvs = await Investment.find({ userId, status: 'confirmed' });
  const personalVolume = personalInvs.reduce((acc, i) => acc + Number(i.amount || 0), 0);

  // Direct referrals
  const directs = await User.find({ referredBy: userReferralCode });
  const directIds = directs.map(d => d._id);
  const directInvs = await Investment.find({ userId: { $in: directIds }, status: 'confirmed' });
  const directVolume = directInvs.reduce((acc, i) => acc + Number(i.amount || 0), 0);

  // Total Business (Personal + Team)
  const totalBusiness = personalVolume + directVolume; // Can extend down recursively

  return { personalVolume, directVolume, totalBusiness };
}

/**
 * Evaluates and awards Rank Rewards & Achiever Trips
 */
async function evaluateAndAwardRewards(user) {
  const { directVolume, totalBusiness } = await getUserBusinessVolumes(user._id, user.referralCode);

  // 1. Rank Rewards (One-Time)
  for (const r of RANK_TARGETS) {
    if (totalBusiness >= r.target) {
      const alreadyAwarded = await Reward.findOne({
        userId: user._id,
        type: 'rank_bonus',
        targetVolume: r.target
      });

      if (!alreadyAwarded) {
        const bonusAmount = r.bonus || (r.bonusRate ? Math.round(r.target * r.bonusRate) : r.fixedBonus);

        await Reward.create({
          userId: user._id,
          type: 'rank_bonus',
          rewardName: `Rank Reward: ${r.rankName}`,
          targetVolume: r.target,
          bonusAmount,
          status: 'claimed'
        });

        // Credit referral wallet
        await ledgerService.credit({
          userId: user._id,
          walletType: 'referral',
          amount: bonusAmount,
          type: 'rank_reward',
          description: `Rank Bonus · ${r.rankName}`,
          subtitle: `Achieved ₹${r.target.toLocaleString('en-IN')} cumulative volume`
        });

        user.rank = r.rankName;
        await user.save();
      }
    }
  }

  // 2. Achiever Trips (Within 4 Months)
  const joinedDate = new Date(user.createdAt || Date.now());
  const isWithin4Months = (Date.now() - joinedDate.getTime()) <= (120 * 24 * 60 * 60 * 1000);

  if (isWithin4Months) {
    for (const t of ACHIEVER_TRIPS) {
      if (directVolume >= t.target) {
        const alreadyWon = await Reward.findOne({
          userId: user._id,
          type: 'achiever_trip',
          targetVolume: t.target
        });

        if (!alreadyWon) {
          await Reward.create({
            userId: user._id,
            type: 'achiever_trip',
            rewardName: t.trip,
            targetVolume: t.target,
            status: 'claimed'
          });
        }
      }
    }
  }
}

module.exports = {
  RANK_TARGETS,
  ACHIEVER_TRIPS,
  getUserBusinessVolumes,
  evaluateAndAwardRewards
};
