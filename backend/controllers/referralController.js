const User = require('../models/User');
const { REFERRAL_CONFIG } = require('../services/referralService');
const { getUserBusinessVolumes } = require('../services/rewardService');

// 1. Get Referral Overview & Direct Referrals
exports.getReferralOverview = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const Investment = require('../models/Investment');
    const rawDirects = await User.find({ referredBy: user.referralCode })
      .select('name email phone walletAddress kycStatus createdAt')
      .lean();

    const directs = await Promise.all(rawDirects.map(async (d) => {
      const activeInvs = await Investment.find({
        userId: d._id,
        status: { $in: ['confirmed', 'ACTIVE', 'CONFIRMED', 'active'] }
      }).lean();

      const totalActive = activeInvs.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
      const dailyRoi = activeInvs.reduce((acc, i) => acc + (Number(i.dailyRoiAmount) || 0), 0);
      const myCommission = Math.round(dailyRoi * 0.05); // 5% Level 1

      return {
        id: String(d._id),
        name: d.name || 'Member',
        email: d.email || '',
        phone: d.phone || '',
        joined: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Recently',
        active: totalActive > 0 ? `₹${totalActive.toLocaleString('en-IN')}` : '₹0',
        activeNum: totalActive,
        package: activeInvs[0]?.packageName || (totalActive > 0 ? 'Active Staking' : 'Registered'),
        dailyRoi: dailyRoi > 0 ? `₹${dailyRoi.toLocaleString('en-IN')}` : '₹0',
        myCommission: myCommission > 0 ? `₹${myCommission}/day` : '₹0/day',
        status: totalActive > 0 ? 'Active' : 'Registered'
      };
    }));

    const { personalVolume, directVolume, totalBusiness } = await getUserBusinessVolumes(user._id, user.referralCode);
    const isReferralActivated = Boolean(user.isReferralActivated || personalVolume > 0 || (user.activeInvestedAmount && user.activeInvestedAmount > 0));

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        directsCount: directs.length,
        personalVolume,
        directVolume,
        totalBusiness,
        isReferralActivated,
        activeInvestedAmount: Math.max(Number(user.activeInvestedAmount || 0), personalVolume),
        referralTiers: REFERRAL_CONFIG.tiers,
        directs
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Explicit Referral Activation Endpoint
exports.activateReferral = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const Investment = require('../models/Investment');
    const activeInvestments = await Investment.find({
      userId: req.user._id,
      status: { $in: ['confirmed', 'ACTIVE', 'CONFIRMED', 'active'] }
    });
    const totalInvested = activeInvestments.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const effectiveCapital = Math.max(Number(user.activeInvestedAmount || 0), totalInvested);

    user.isReferralActivated = true;
    if (effectiveCapital > 0) {
      user.activeInvestedAmount = effectiveCapital;
    }
    await user.save();

    return res.json({
      success: true,
      message: 'Referral account successfully activated!',
      isReferralActivated: true,
      activeInvestedAmount: user.activeInvestedAmount || 0
    });
  } catch (error) {
    next(error);
  }
};

