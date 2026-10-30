const Reward = require('../models/Reward');
const RankReward = require('../models/RankReward');
const AchieverBonus = require('../models/AchieverBonus');
const ReferralIncome = require('../models/ReferralIncome');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { RANK_TARGETS, ACHIEVER_TRIPS, getUserBusinessVolumes } = require('../services/rewardService');

// 1. Get Rewards Status & Progress (Combined)
exports.getMyRewards = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const { directVolume, totalBusiness } = await getUserBusinessVolumes(user._id, user.referralCode);
    const claimedRewards = await Reward.find({ userId: user._id });

    const claimedRankTargets = claimedRewards
      .filter(r => r.type === 'rank_bonus')
      .map(r => r.targetVolume || r.targetINR);

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

// 2. GET /api/rewards/rank
exports.getRankRewards = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const { totalBusiness } = await getUserBusinessVolumes(user._id, user.referralCode);
    const rankRewards = await Reward.find({ userId: user._id, type: 'rank_bonus' });

    const progress = RANK_TARGETS.map(r => ({
      rankTargetINR: r.target,
      rankName: r.rank,
      bonusAmount: r.bonus,
      calculationBase: r.calculationBase || 'TOTAL_BUSINESS',
      isAchieved: totalBusiness >= r.target,
      isClaimed: rankRewards.some(rr => (rr.targetVolume || rr.targetINR) === r.target)
    }));

    res.json({
      success: true,
      data: {
        currentRank: user.rank,
        totalBusinessINR: totalBusiness,
        ranks: progress,
        history: rankRewards
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. GET /api/rewards/achiever
exports.getAchieverRewards = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const { directVolume } = await getUserBusinessVolumes(user._id, user.referralCode);
    const achievers = await AchieverBonus.find({ userId: user._id });

    const joinedDate = new Date(user.createdAt || Date.now());
    const fourMonthsMs = 120 * 24 * 60 * 60 * 1000;
    const isWithinWindow = (Date.now() - joinedDate.getTime()) <= fourMonthsMs;
    const remainingDays = Math.max(0, Math.ceil((joinedDate.getTime() + fourMonthsMs - Date.now()) / (24 * 60 * 60 * 1000)));

    const trips = ACHIEVER_TRIPS.map(t => ({
      targetINR: t.target,
      rewardName: t.trip,
      isQualified: isWithinWindow && (directVolume >= t.target),
      progressPercent: Math.min(100, Math.round((directVolume / t.target) * 100))
    }));

    res.json({
      success: true,
      data: {
        directVolumeINR: directVolume,
        isWithinWindow,
        remainingDays,
        trips,
        history: achievers
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. GET /api/rewards/referral-income
exports.getReferralIncome = async (req, res, next) => {
  try {
    const incomes = await ReferralIncome.find({ sponsorId: req.user._id })
      .populate('fromUserId', 'name email referralCode')
      .sort({ date: -1 })
      .limit(100);

    const totalIncome = incomes.reduce((acc, curr) => acc + (curr.amountINR || 0), 0);

    res.json({
      success: true,
      data: {
        totalReferralIncomeINR: totalIncome,
        history: incomes
      }
    });
  } catch (error) {
    next(error);
  }
};
