const { DB } = require('../models');
const { RANK_REWARDS, ACHIEVER_TRIPS, REFERRAL_TIERS } = require('../config/constants');

// 1. Get Referral Network Summary
exports.getReferralOverview = async (req, res) => {
  try {
    const user = await DB.users.findById(req.user._id);

    // Fetch direct referrals
    const directs = await DB.users.find({ referredBy: user.referralCode });

    const totalBusiness = (Number(user.activeInvestedAmount) || 0) + (Number(user.teamBusiness) || 0);
    const directBusiness = Number(user.directBusiness) || 0;

    // Calculate Rank Progress
    const rankProgress = RANK_REWARDS.map(r => {
      const isClaimed = (user.claimedRankRewards || []).includes(`rank_${r.target}`);
      const progressPercent = Math.min(100, Math.round((totalBusiness / r.target) * 100));
      return {
        ...r,
        achieved: totalBusiness >= r.target,
        claimed: isClaimed,
        progressPercent
      };
    });

    // Calculate Achiever Trips Progress (Within 4 months)
    const joinedTime = new Date(user.createdAt || Date.now()).getTime();
    const expiryTime = joinedTime + (120 * 24 * 60 * 60 * 1000); // 4 months
    const remainingDays = Math.max(0, Math.ceil((expiryTime - Date.now()) / (24 * 60 * 60 * 1000)));

    const tripsProgress = ACHIEVER_TRIPS.map(t => {
      const isWon = (user.achieverTripsWon || []).includes(t.reward);
      const progressPercent = Math.min(100, Math.round((directBusiness / t.target) * 100));
      return {
        ...t,
        won: isWon,
        progressPercent,
        needed: Math.max(0, t.target - directBusiness)
      };
    });

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        directsCount: directs.length,
        directBusiness,
        teamBusiness: user.teamBusiness || 0,
        totalBusiness,
        rank: user.rank || 'Bronze Leader',
        rankProgress,
        tripsProgress,
        fourMonthsRemainingDays: remainingDays,
        referralTiers: REFERRAL_TIERS,
        directs: directs.map(d => ({
          id: d._id,
          name: d.name,
          email: d.email,
          phone: d.phone,
          activeInvested: d.activeInvestedAmount || 0,
          joinedDate: d.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Referral overview error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch referral overview.' });
  }
};

