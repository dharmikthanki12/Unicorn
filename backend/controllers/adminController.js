const User = require('../models/User');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const Investment = require('../models/Investment');
const Package = require('../models/Package');
const Reward = require('../models/Reward');
const RankReward = require('../models/RankReward');
const AchieverBonus = require('../models/AchieverBonus');
const ReferralIncome = require('../models/ReferralIncome');
const PlatformSettings = require('../models/PlatformSettings');
const AuditLog = require('../models/AuditLog');
const { runDailyRoiJob } = require('../jobs/roiJob');
const ApiError = require('../utils/ApiError');
const ledgerService = require('../services/ledgerService');

// 1. Get Admin Dashboard Metrics
exports.getAdminMetrics = async (req, res, next) => {
  try {
    const [totalUsers, activeInvestments, approvedDeposits, approvedWithdrawals, pendingDepositsCount, pendingWithdrawalsCount] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Investment.find({ status: { $in: ['confirmed', 'ACTIVE'] } }),
      Deposit.find({ status: { $in: ['approved', 'APPROVED'] } }),
      Withdrawal.find({ status: { $in: ['approved', 'paid', 'COMPLETED'] } }),
      Deposit.countDocuments({ status: { $in: ['pending', 'PENDING'] } }),
      Withdrawal.countDocuments({ status: { $in: ['pending', 'PENDING'] } })
    ]);

    const activeStakedVolume = activeInvestments.reduce((acc, i) => acc + Number(i.amount || 0), 0);
    const totalDeposited = approvedDeposits.reduce((acc, d) => acc + Number(d.amount || 0), 0);
    const totalWithdrawn = approvedWithdrawals.reduce((acc, w) => acc + Number(w.amount || 0), 0);
    const dailyRoiDistributed = Math.round(activeStakedVolume * 0.0045);

    res.json({
      success: true,
      metrics: {
        totalUsers,
        activeStakedVolume,
        totalDeposited,
        totalWithdrawn,
        dailyRoiDistributed,
        pendingApprovalsCount: pendingDepositsCount + pendingWithdrawalsCount,
        pendingDepositsCount,
        pendingWithdrawalsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Users Management
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status, kycStatus, rank, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return next(new ApiError(404, 'User not found.'));

    if (status) user.status = status;
    if (kycStatus) user.kycStatus = kycStatus;
    if (rank) user.rank = rank;
    if (role) user.role = role;

    await user.save();

    await AuditLog.create({
      performedBy: req.user._id,
      action: 'UPDATE_USER_STATUS',
      entityType: 'User',
      entityId: user._id,
      details: { status, kycStatus, rank, role }
    });

    res.json({
      success: true,
      message: 'User status updated successfully.',
      user
    });
  } catch (error) {
    next(error);
  }
};

// 3. Packages Management
exports.getAllPackages = async (req, res, next) => {
  try {
    const packages = await Package.find().sort({ tier: 1 });
    res.json({
      success: true,
      packages
    });
  } catch (error) {
    next(error);
  }
};

exports.createPackage = async (req, res, next) => {
  try {
    const pkg = await Package.create(req.body);
    await AuditLog.create({
      performedBy: req.user._id,
      action: 'CREATE_PACKAGE',
      entityType: 'Package',
      entityId: pkg._id,
      details: req.body
    });
    res.status(201).json({
      success: true,
      message: 'Package created successfully.',
      package: pkg
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePackage = async (req, res, next) => {
  try {
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pkg) return next(new ApiError(404, 'Package not found.'));

    await AuditLog.create({
      performedBy: req.user._id,
      action: 'UPDATE_PACKAGE',
      entityType: 'Package',
      entityId: pkg._id,
      details: req.body
    });

    res.json({
      success: true,
      message: 'Package updated successfully.',
      package: pkg
    });
  } catch (error) {
    next(error);
  }
};

// 4. Deposits Management
exports.getAllDeposits = async (req, res, next) => {
  try {
    const deposits = await Deposit.find().populate('userId', 'name email referralCode').sort({ createdAt: -1 });
    res.json({
      success: true,
      deposits
    });
  } catch (error) {
    next(error);
  }
};

exports.updateDeposit = async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body;
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) return next(new ApiError(404, 'Deposit request not found.'));

    if (status === 'approved' && deposit.status === 'pending') {
      await ledgerService.credit({
        userId: deposit.userId,
        walletType: 'main',
        amount: deposit.amount,
        type: 'deposit',
        referenceId: String(deposit._id),
        description: `Deposit Approved · ${deposit.paymentMethod}`,
        subtitle: `Ref: ${deposit.transactionReference ? deposit.transactionReference.slice(0, 16) : ''}...`
      });
      deposit.status = 'approved';
    } else if (status === 'rejected' && deposit.status === 'pending') {
      deposit.status = 'rejected';
      deposit.reviewNotes = reviewNotes || 'Rejected by administrator';
    }

    deposit.reviewedBy = req.user._id;
    deposit.reviewedAt = new Date();
    await deposit.save();

    await AuditLog.create({
      performedBy: req.user._id,
      action: `DEPOSIT_${status.toUpperCase()}`,
      entityType: 'Deposit',
      entityId: deposit._id,
      details: { status, reviewNotes }
    });

    res.json({
      success: true,
      message: `Deposit updated to ${deposit.status}.`,
      deposit
    });
  } catch (error) {
    next(error);
  }
};

// 5. Withdrawals Management
exports.getAllWithdrawals = async (req, res, next) => {
  try {
    const withdrawals = await Withdrawal.find().populate('userId', 'name email referralCode').sort({ createdAt: -1 });
    res.json({
      success: true,
      withdrawals
    });
  } catch (error) {
    next(error);
  }
};

exports.updateWithdrawal = async (req, res, next) => {
  try {
    const { status, adminNotes, txHash } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return next(new ApiError(404, 'Withdrawal request not found.'));

    if (status === 'approved' && withdrawal.status === 'pending') {
      withdrawal.status = 'approved';
    } else if (status === 'rejected' && withdrawal.status === 'pending') {
      await ledgerService.releaseReservedWithdrawal(withdrawal.userId, withdrawal.walletSource, withdrawal.amount);
      withdrawal.status = 'rejected';
      withdrawal.adminNotes = adminNotes || 'Rejected by administrator';
    } else if (status === 'paid' || status === 'COMPLETED') {
      await ledgerService.finalizeWithdrawal(withdrawal.userId, withdrawal.walletSource, withdrawal.amount);
      withdrawal.status = 'paid';
      if (txHash) withdrawal.txHash = txHash;
    }

    withdrawal.reviewedBy = req.user._id;
    withdrawal.reviewedAt = new Date();
    await withdrawal.save();

    await AuditLog.create({
      performedBy: req.user._id,
      action: `WITHDRAWAL_${status.toUpperCase()}`,
      entityType: 'Withdrawal',
      entityId: withdrawal._id,
      details: { status, adminNotes, txHash }
    });

    res.json({
      success: true,
      message: `Withdrawal updated to ${withdrawal.status}.`,
      withdrawal
    });
  } catch (error) {
    next(error);
  }
};

// 6. Referral Rewards Management
exports.getAllReferralRewards = async (req, res, next) => {
  try {
    const incomes = await ReferralIncome.find()
      .populate('sponsorId', 'name email referralCode')
      .populate('fromUserId', 'name email referralCode')
      .sort({ date: -1 })
      .limit(200);
    res.json({
      success: true,
      referralRewards: incomes
    });
  } catch (error) {
    next(error);
  }
};

exports.updateReferralReward = async (req, res, next) => {
  try {
    const { status } = req.body;
    const income = await ReferralIncome.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!income) return next(new ApiError(404, 'Referral income record not found.'));
    res.json({
      success: true,
      message: 'Referral reward updated successfully.',
      referralReward: income
    });
  } catch (error) {
    next(error);
  }
};

// 7. Rank Rewards Management
exports.getAllRankRewards = async (req, res, next) => {
  try {
    const rankRewards = await Reward.find({ type: 'rank_bonus' })
      .populate('userId', 'name email referralCode')
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      rankRewards
    });
  } catch (error) {
    next(error);
  }
};

exports.updateRankReward = async (req, res, next) => {
  try {
    const { status } = req.body;
    const reward = await Reward.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!reward) return next(new ApiError(404, 'Rank reward not found.'));
    res.json({
      success: true,
      message: 'Rank reward updated successfully.',
      rankReward: reward
    });
  } catch (error) {
    next(error);
  }
};

// 8. Achiever Bonuses Management
exports.getAllAchieverBonuses = async (req, res, next) => {
  try {
    const achievers = await AchieverBonus.find()
      .populate('userId', 'name email referralCode')
      .sort({ qualificationDate: -1 });
    res.json({
      success: true,
      achieverBonuses: achievers
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAchieverBonus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const bonus = await AchieverBonus.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!bonus) return next(new ApiError(404, 'Achiever bonus record not found.'));
    res.json({
      success: true,
      message: 'Achiever bonus updated successfully.',
      achieverBonus: bonus
    });
  } catch (error) {
    next(error);
  }
};

// 9. Financial & User Reports
exports.getFinancialReport = async (req, res, next) => {
  try {
    const [deposits, withdrawals, investments] = await Promise.all([
      Deposit.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: '$currency', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Withdrawal.aggregate([
        { $match: { status: { $in: ['approved', 'paid'] } } },
        { $group: { _id: '$payoutMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Investment.aggregate([
        { $group: { _id: '$packageName', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        depositsSummary: deposits,
        withdrawalsSummary: withdrawals,
        investmentsSummary: investments
      }
    });
  } catch (error) {
    next(error);
  }
};

// 10. Platform Settings Management
exports.getPlatformSettings = async (req, res, next) => {
  try {
    let settings = await PlatformSettings.findOne({ isCurrent: true });
    if (!settings) {
      settings = await PlatformSettings.create({ isCurrent: true });
    }
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePlatformSettings = async (req, res, next) => {
  try {
    let settings = await PlatformSettings.findOneAndUpdate(
      { isCurrent: true },
      { $set: req.body },
      { new: true, upsert: true, runValidators: true }
    );

    await AuditLog.create({
      performedBy: req.user._id,
      action: 'UPDATE_PLATFORM_SETTINGS',
      entityType: 'PlatformSettings',
      entityId: settings._id,
      details: req.body
    });

    res.json({
      success: true,
      message: 'Platform settings updated successfully.',
      settings
    });
  } catch (error) {
    next(error);
  }
};

// 11. Manually Trigger Daily ROI Cycle
exports.triggerDailyRoiCycle = async (req, res, next) => {
  try {
    const result = await runDailyRoiJob();

    await AuditLog.create({
      performedBy: req.user._id,
      action: 'TRIGGER_DAILY_ROI',
      entityType: 'System',
      entityId: 'ROI_JOB',
      details: result
    });

    res.json({
      success: true,
      message: `Executed 0.45% Daily ROI & Multi-level referral distributions for ${result.processedCount} investments. Total: ₹${result.totalRoiPaid.toLocaleString('en-IN')}`,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// 12. Audit Logs
exports.getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find().populate('performedBy', 'name email role').sort({ createdAt: -1 }).limit(100);
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    next(error);
  }
};
