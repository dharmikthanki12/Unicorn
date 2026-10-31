const User = require('../models/User');
const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const ReferralIncome = require('../models/ReferralIncome');
const Reward = require('../models/Reward');
const AuditLog = require('../models/AuditLog');
const ledgerService = require('../services/ledgerService');
const { getUserBusinessVolumes } = require('../services/rewardService');
const ApiError = require('../utils/ApiError');

// 1. Get Logged-in User Profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return next(new ApiError(404, 'User not found.'));

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        walletAddress: user.walletAddress,
        web3Connected: user.web3Connected,
        kycStatus: user.kycStatus,
        rank: user.rank,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Update Profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return next(new ApiError(404, 'User not found.'));

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        kycStatus: user.kycStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Change Password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return next(new ApiError(400, 'Current and new password are required.'));
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new ApiError(400, 'Incorrect current password.'));
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// 4. Link/Update Web3 Wallet Address
exports.updateWalletAddress = async (req, res, next) => {
  try {
    const { address, connected } = req.body;
    if (require('mongoose').connection.readyState !== 1) {
      return next(new ApiError(503, 'Database is not connected. Unable to update wallet address.'));
    }

    const user = await User.findById(req.user._id);
    if (!user) return next(new ApiError(404, 'User not found.'));

    user.walletAddress = address ? address.trim() : null;
    user.web3Connected = Boolean(connected);
    await user.save();

    res.json({
      success: true,
      message: connected ? 'BEP-20 wallet connected successfully.' : 'Wallet disconnected.',
      walletAddress: user.walletAddress,
      web3Connected: user.web3Connected
    });
  } catch (error) {
    next(error);
  }
};

// 5. User Dashboard Overview
exports.getDashboard = async (req, res, next) => {
  try {
    const wallet = await ledgerService.getOrCreateWallet(req.user._id);

    // Active investments
    const activeInvestments = await Investment.find({
      userId: req.user._id,
      status: { $in: ['confirmed', 'ACTIVE', 'active'] }
    });
    const activeInvestedAmount = activeInvestments.reduce((acc, i) => acc + Number(i.amount || 0), 0);
    const todayRoiIncome = activeInvestments.reduce((acc, i) => acc + Number(i.dailyRoiAmount || 0), 0);

    // Recent transactions
    const recentTransactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(6);

    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          referralCode: user.referralCode,
          rank: user.rank,
          kycStatus: user.kycStatus,
          walletAddress: user.walletAddress,
          web3Connected: user.web3Connected
        },
        balances: {
          main: wallet.mainBalance,
          roi: wallet.roiBalance,
          referral: wallet.referralBalance,
          unc: wallet.uncBalance,
          mainBalance: wallet.mainBalance,
          roiBalance: wallet.roiBalance,
          referralBalance: wallet.referralBalance,
          uncBalance: wallet.uncBalance
        },
        metrics: {
          activeInvestedAmount,
          todayRoiIncome,
          activePackage: activeInvestments[0] || null
        },
        recentTransactions
      }
    });
  } catch (error) {
    next(error);
  }
};

// 6. User Direct Referrals
exports.getReferrals = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const directs = await User.find({ referredBy: user.referralCode })
      .select('name email phone walletAddress kycStatus createdAt')
      .sort({ createdAt: -1 });

    const volumes = await getUserBusinessVolumes(user._id, user.referralCode);

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        directsCount: directs.length,
        ...volumes,
        directs
      }
    });
  } catch (error) {
    next(error);
  }
};

// 7. User Multi-Level Referral Tree
exports.getReferralTree = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    async function buildTree(refCode, currentDepth = 1, maxDepth = 5) {
      if (currentDepth > maxDepth) return [];
      const children = await User.find({ referredBy: refCode }).select('name email referralCode kycStatus createdAt');
      const nodes = [];
      for (const child of children) {
        const sub = await buildTree(child.referralCode, currentDepth + 1, maxDepth);
        nodes.push({
          id: child._id,
          name: child.name,
          email: child.email,
          referralCode: child.referralCode,
          level: currentDepth,
          downline: sub
        });
      }
      return nodes;
    }

    const tree = await buildTree(user.referralCode, 1, 5);

    res.json({
      success: true,
      data: {
        root: {
          id: user._id,
          name: user.name,
          referralCode: user.referralCode
        },
        tree
      }
    });
  } catch (error) {
    next(error);
  }
};

// 8. User Earnings Summary
exports.getEarnings = async (req, res, next) => {
  try {
    const roiTx = await Transaction.aggregate([
      { $match: { userId: req.user._id, type: { $in: ['roi_credit', 'ROI'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const referralTx = await Transaction.aggregate([
      { $match: { userId: req.user._id, type: { $in: ['referral_bonus', 'REFERRAL'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const rankTx = await Transaction.aggregate([
      { $match: { userId: req.user._id, type: { $in: ['rank_reward', 'RANK_REWARD'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalRoi = roiTx[0] ? roiTx[0].total : 0;
    const totalReferral = referralTx[0] ? referralTx[0].total : 0;
    const totalRank = rankTx[0] ? rankTx[0].total : 0;

    res.json({
      success: true,
      data: {
        totalRoi,
        totalReferral,
        totalRank,
        totalEarnings: totalRoi + totalReferral + totalRank
      }
    });
  } catch (error) {
    next(error);
  }
};

// 6. Submit KYC Documents for Admin Review
exports.submitKyc = async (req, res, next) => {
  try {
    const { documentType, documentId } = req.body;
    if (!documentId) return next(new ApiError(400, 'Document ID / Number is required.'));

    const user = await User.findById(req.user._id);
    if (!user) return next(new ApiError(404, 'User not found.'));

    user.kycStatus = 'PENDING';
    user.kycDocumentType = documentType || 'Government ID';
    user.kycDocumentId = String(documentId).trim();
    user.kycSubmittedAt = new Date();
    await user.save();

    await AuditLog.create({
      performedBy: user._id,
      action: 'KYC_SUBMITTED',
      entityType: 'User',
      entityId: user._id,
      details: { documentType: user.kycDocumentType, documentId: user.kycDocumentId }
    });

    res.json({
      success: true,
      message: 'KYC documents submitted successfully. Status is now PENDING admin review.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        kycStatus: user.kycStatus,
        kycDocumentType: user.kycDocumentType,
        kycDocumentId: user.kycDocumentId
      }
    });
  } catch (error) {
    next(error);
  }
};
