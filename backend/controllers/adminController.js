const User = require('../models/User');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const Investment = require('../models/Investment');
const AuditLog = require('../models/AuditLog');
const { runDailyRoiJob } = require('../jobs/roiJob');
const ApiError = require('../utils/ApiError');

// 1. Get Admin Dashboard Metrics
exports.getAdminMetrics = async (req, res, next) => {
  try {
    const [totalUsers, activeInvestments, approvedDeposits, approvedWithdrawals, pendingDepositsCount, pendingWithdrawalsCount] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Investment.find({ status: 'confirmed' }),
      Deposit.find({ status: 'approved' }),
      Withdrawal.find({ status: { $in: ['approved', 'paid'] } }),
      Deposit.countDocuments({ status: 'pending' }),
      Withdrawal.countDocuments({ status: 'pending' })
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

// 2. Get All Users
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

// 3. Update User Status / KYC
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status, kycStatus, rank } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ApiError(404, 'User not found.'));
    }

    if (status) user.status = status;
    if (kycStatus) user.kycStatus = kycStatus;
    if (rank) user.rank = rank;

    await user.save();

    await AuditLog.create({
      performedBy: req.user._id,
      action: 'UPDATE_USER_STATUS',
      entityType: 'User',
      entityId: user._id,
      details: { status, kycStatus, rank }
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

// 4. Manually Run Daily ROI Cycle
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

// 5. Get Audit Logs
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
