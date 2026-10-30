const Reward = require('../models/Reward');
const User = require('../models/User');
const { RANK_TARGETS, ACHIEVER_TRIPS, getUserBusinessVolumes } = require('../services/rewardService');

// 1. Get Rewards Status & Progress
exports.getMyRewards = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const { directVolume, totalBusiness } = await getUserBusinessVolumes(user._id, user.referralCode);
    const claimedRewards = await Reward.find({ userId: user._id });

    const claimedRankTargets = claimedRewards
      .filter(r => r.type === 'rank_bonus')
      .map(r => r.targetVolume);

    const wonTrips = claimedRewards
      .filter(r => r.type === 'achiever_trip')
      .map(r => r.rewardName);

    // Calculate Rank Rewards Progress
    const rankProgress = RANK_TARGETS.map(r => ({
      ...r,
      achieved: totalBusiness >= r.target,
      claimed: claimedRankTargets.includes(r.target),
      progressPercent: Math.min(100, Math.round((totalBusiness / r.target) * 100))
    }));

    // Calculate Achiever Trips Progress (within 4 months)
    const joinedDate = new Date(user.createdAt || Date.now());
    const fourMonthsMs = 120 * 24 * 60 * 60 * 1000;
    const remainingDays = Math.max(0, Math.ceil((joinedDate.getTime() + fourMonthsMs - Date.now()) / (24 * 60 * 60 * 1000)));

    const tripsProgress = ACHIEVER_TRIPS.map(t => ({
      ...t,
      won: wonTrips.includes(t.trip),
      progressPercent: Math.min(100, Math.round((directVolume / t.target) * 100)),
      remainingVolume: Math.max(0, t.target - directVolume)
    }));

    res.json({
      success: true,
      currentRank: user.rank,
      totalBusiness,
      directVolume,
      fourMonthsRemainingDays: remainingDays,
      rankProgress,
      tripsProgress,
      claimedRewards
    });
  } catch (error) {
    next(error);
  }
};

