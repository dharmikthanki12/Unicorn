const User = require('../models/User');
const { REFERRAL_CONFIG } = require('../services/referralService');
const { getUserBusinessVolumes } = require('../services/rewardService');

// 1. Get Referral Overview & Direct Referrals
exports.getReferralOverview = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const directs = await User.find({ referredBy: user.referralCode }).select('name email phone walletAddress kycStatus createdAt');
    const { personalVolume, directVolume, totalBusiness } = await getUserBusinessVolumes(user._id, user.referralCode);

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        directsCount: directs.length,
        personalVolume,
        directVolume,
        totalBusiness,
        referralTiers: REFERRAL_CONFIG.tiers,
        directs
      }
    });
  } catch (error) {
    next(error);
  }
};

