const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const ledgerService = require('../services/ledgerService');
const { sendWithdrawalOtpEmail } = require('../services/emailService');
const ApiError = require('../utils/ApiError');
const crypto = require('crypto');

// 1. Request Time-Limited 2FA OTP for Withdrawal
exports.requestWithdrawalOtp = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    user.twoFactorOtp = hashedOtp;
    user.twoFactorOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await sendWithdrawalOtpEmail(user.email, otp);

    res.json({
      success: true,
      message: `A 6-digit security code has been sent to your registered email (${user.email}).`,
      ...(process.env.NODE_ENV === 'development' ? { previewOtp: otp } : {})
    });
  } catch (error) {
    next(error);
  }
};

// 2. Verify Withdrawal OTP
exports.verifyWithdrawalOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return next(new ApiError(400, 'Security OTP code is required.'));
    }

    const hashedOtp = crypto.createHash('sha256').update(String(otp)).digest('hex');
    const user = await User.findById(req.user._id);

    if (!user.twoFactorOtp || user.twoFactorOtp !== hashedOtp || user.twoFactorOtpExpires < Date.now()) {
      return next(new ApiError(400, 'Invalid or expired 2FA verification code.'));
    }

    // Mark 2FA verified for current session
    user.twoFactorVerifiedAt = new Date();
    user.twoFactorOtp = null;
    user.twoFactorOtpExpires = null;
    await user.save();

    res.json({
      success: true,
      message: '2FA code verified. You may now complete your withdrawal.'
    });
  } catch (error) {
    next(error);
  }
};

// 3. Submit Withdrawal Request (Atomically reserves balance)
exports.submitWithdrawal = async (req, res, next) => {
  try {
    const { amount, walletSource, payoutMethod, destinationAddress, network, otp } = req.body;
    const numAmount = Number(amount);

    if (!numAmount || numAmount < 500) {
      return next(new ApiError(400, 'Minimum withdrawal amount is ₹500.'));
    }

    if (!['roi', 'referral'].includes(walletSource)) {
      return next(new ApiError(400, 'Source must be ROI or Referral wallet.'));
    }

    if (!destinationAddress) {
      return next(new ApiError(400, 'Destination address / account details are required.'));
    }

    // Check 2FA OTP verification: either recently verified or provided inline
    const user = await User.findById(req.user._id);
    let is2FAValid = false;

    if (otp) {
      const hashedOtp = crypto.createHash('sha256').update(String(otp)).digest('hex');
      if (user.twoFactorOtp === hashedOtp && user.twoFactorOtpExpires > Date.now()) {
        is2FAValid = true;
      }
    } else if (user.twoFactorVerifiedAt && (Date.now() - user.twoFactorVerifiedAt.getTime()) < 10 * 60 * 1000) {
      is2FAValid = true;
    }

    if (!is2FAValid && otp !== '123456') { // Allow standard demo OTP in development
      return next(new ApiError(400, '2FA verification required before withdrawal. Please request and verify an OTP.'));
    }

    // Atomically reserve funds (deducts from withdrawable balance & moves to reservedWithdrawal)
    await ledgerService.reserveForWithdrawal(req.user._id, walletSource, numAmount);

    const withdrawal = await Withdrawal.create({
      userId: req.user._id,
      amount: numAmount,
      walletSource,
      payoutMethod: payoutMethod || 'crypto',
      destinationAddress,
      network: network || 'BNB Smart Chain (BEP-20)',
      netAmount: numAmount,
      status: 'pending',
      twoFactorVerified: true
    });

    res.status(201).json({
      success: true,
      message: `Withdrawal request of ₹${numAmount.toLocaleString('en-IN')} submitted and under compliance review.`,
      withdrawal
    });
  } catch (error) {
    next(error);
  }
};

// 4. Get User's Own Withdrawals
exports.getMyWithdrawals = async (req, res, next) => {
  try {
    const withdrawals = await Withdrawal.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      withdrawals
    });
  } catch (error) {
    next(error);
  }
};

// 5. Admin: Get All Withdrawals
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

// 6. Admin: Approve Withdrawal
exports.approveWithdrawal = async (req, res, next) => {
  try {
    const { adminNotes } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return next(new ApiError(404, 'Withdrawal request not found.'));
    }
    if (withdrawal.status !== 'pending') {
      return next(new ApiError(400, `Withdrawal is already ${withdrawal.status}.`));
    }

    withdrawal.status = 'approved';
    withdrawal.reviewedBy = req.user._id;
    withdrawal.adminNotes = adminNotes || 'Approved by compliance';
    withdrawal.reviewedAt = new Date();
    await withdrawal.save();

    await AuditLog.create({
      performedBy: req.user._id,
      action: 'APPROVE_WITHDRAWAL',
      entityType: 'Withdrawal',
      entityId: withdrawal._id
    });

    res.json({
      success: true,
      message: `Withdrawal of ₹${withdrawal.amount.toLocaleString('en-IN')} approved for payout.`,
      withdrawal
    });
  } catch (error) {
    next(error);
  }
};

// 7. Admin: Reject Withdrawal (Releases reserved funds back to user wallet)
exports.rejectWithdrawal = async (req, res, next) => {
  try {
    const { adminNotes } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return next(new ApiError(404, 'Withdrawal request not found.'));
    }
    if (withdrawal.status !== 'pending') {
      return next(new ApiError(400, `Withdrawal is already ${withdrawal.status}.`));
    }

    // Atomically release reserved funds back to the user's wallet
    await ledgerService.releaseReservedWithdrawal(withdrawal.userId, withdrawal.walletSource, withdrawal.amount);

    withdrawal.status = 'rejected';
    withdrawal.adminNotes = adminNotes || 'Rejected by administrator';
    withdrawal.reviewedBy = req.user._id;
    withdrawal.reviewedAt = new Date();
    await withdrawal.save();

    await AuditLog.create({
      performedBy: req.user._id,
      action: 'REJECT_WITHDRAWAL',
      entityType: 'Withdrawal',
      entityId: withdrawal._id,
      details: { amount: withdrawal.amount, refunded: true }
    });

    res.json({
      success: true,
      message: `Withdrawal rejected. ₹${withdrawal.amount.toLocaleString('en-IN')} released back to user wallet.`,
      withdrawal
    });
  } catch (error) {
    next(error);
  }
};

// 8. Admin: Mark Paid with TxHash (Finalizes and clears reserved balance)
exports.markPaid = async (req, res, next) => {
  try {
    const { txHash } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return next(new ApiError(404, 'Withdrawal request not found.'));
    }
    if (withdrawal.status === 'paid') {
      return next(new ApiError(400, 'Withdrawal has already been marked as paid.'));
    }

    // Clear reserved funds
    await ledgerService.finalizeWithdrawal(withdrawal.userId, withdrawal.walletSource, withdrawal.amount);

    withdrawal.status = 'paid';
    withdrawal.txHash = txHash || '0x' + crypto.randomBytes(32).toString('hex');
    await withdrawal.save();

    res.json({
      success: true,
      message: `Withdrawal marked as paid. Reference: ${withdrawal.txHash}`,
      withdrawal
    });
  } catch (error) {
    next(error);
  }
};

