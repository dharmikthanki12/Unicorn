const Deposit = require('../models/Deposit');
const AuditLog = require('../models/AuditLog');
const ledgerService = require('../services/ledgerService');
const { verifyTransactionOnChain } = require('../services/blockchainService');
const ApiError = require('../utils/ApiError');

// 1. Submit Deposit Request
exports.submitDeposit = async (req, res, next) => {
  try {
    const { amount, currency, paymentMethod, transactionReference, blockchainTxHash } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return next(new ApiError(400, 'Valid deposit amount is required.'));
    }

    if (!transactionReference && !blockchainTxHash) {
      return next(new ApiError(400, 'Transaction reference/UTR or blockchain TxHash is required.'));
    }

    // Check duplicate transaction reference / txHash
    const ref = transactionReference || blockchainTxHash;
    const existing = await Deposit.findOne({ transactionReference: ref });
    if (existing) {
      return next(new ApiError(400, 'A deposit with this transaction reference has already been submitted.'));
    }

    // If blockchain payment, optionally check on-chain
    if (paymentMethod === 'USDT (BEP-20)' && blockchainTxHash) {
      await verifyTransactionOnChain(blockchainTxHash);
    }

    const deposit = await Deposit.create({
      userId: req.user._id,
      amount: numAmount,
      currency: currency || 'INR',
      paymentMethod,
      transactionReference: ref,
      blockchainTxHash: blockchainTxHash || '',
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: `Deposit request of ₹${numAmount.toLocaleString('en-IN')} submitted. Our compliance team will credit your wallet upon verification.`,
      deposit
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get User's Own Deposits
exports.getMyDeposits = async (req, res, next) => {
  try {
    const deposits = await Deposit.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      deposits
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Deposit by ID
exports.getDepositById = async (req, res, next) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) {
      return next(new ApiError(404, 'Deposit record not found.'));
    }
    res.json({
      success: true,
      deposit
    });
  } catch (error) {
    next(error);
  }
};

// 4. Admin: Get All Deposits
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

// 5. Admin: Approve Deposit
exports.approveDeposit = async (req, res, next) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) {
      return next(new ApiError(404, 'Deposit request not found.'));
    }
    if (deposit.status !== 'pending') {
      return next(new ApiError(400, `Deposit is already ${deposit.status}.`));
    }

    // Atomically credit Main Wallet through ledger service
    await ledgerService.credit({
      userId: deposit.userId,
      walletType: 'main',
      amount: deposit.amount,
      type: 'deposit',
      referenceId: String(deposit._id),
      description: `Deposit Approved · ${deposit.paymentMethod}`,
      subtitle: `Ref: ${deposit.transactionReference.slice(0, 16)}...`,
      txHash: deposit.blockchainTxHash || deposit.transactionReference
    });

    deposit.status = 'approved';
    deposit.reviewedBy = req.user._id;
    deposit.reviewedAt = new Date();
    await deposit.save();

    await AuditLog.create({
      performedBy: req.user._id,
      action: 'APPROVE_DEPOSIT',
      entityType: 'Deposit',
      entityId: deposit._id,
      details: { amount: deposit.amount, userId: deposit.userId }
    });

    res.json({
      success: true,
      message: `Deposit of ₹${deposit.amount.toLocaleString('en-IN')} approved and credited to Main Wallet.`,
      deposit
    });
  } catch (error) {
    next(error);
  }
};

// 6. Admin: Reject Deposit
exports.rejectDeposit = async (req, res, next) => {
  try {
    const { reviewNotes } = req.body;
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) {
      return next(new ApiError(404, 'Deposit request not found.'));
    }
    if (deposit.status !== 'pending') {
      return next(new ApiError(400, `Deposit is already ${deposit.status}.`));
    }

    deposit.status = 'rejected';
    deposit.reviewNotes = reviewNotes || 'Invalid or unverifiable payment reference';
    deposit.reviewedBy = req.user._id;
    deposit.reviewedAt = new Date();
    await deposit.save();

    await AuditLog.create({
      performedBy: req.user._id,
      action: 'REJECT_DEPOSIT',
      entityType: 'Deposit',
      entityId: deposit._id,
      details: { reviewNotes: deposit.reviewNotes }
    });

    res.json({
      success: true,
      message: `Deposit request of ₹${deposit.amount.toLocaleString('en-IN')} rejected.`,
      deposit
    });
  } catch (error) {
    next(error);
  }
};
