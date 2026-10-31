const Deposit = require('../models/Deposit');
const AuditLog = require('../models/AuditLog');
const ledgerService = require('../services/ledgerService');
const { verifyUsdtDepositOnChain, PLATFORM_USDT_DEPOSIT_ADDRESS } = require('../services/blockchainService');
const ApiError = require('../utils/ApiError');

// 1. Submit Deposit Request (Supports both INR Manual & USDT Automated BEP-20)
exports.submitDeposit = async (req, res, next) => {
  try {
    const {
      amount,
      currency,
      paymentMethod,
      transactionReference,
      blockchainTxHash,
      evidence
    } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return next(new ApiError(400, 'Valid deposit amount is required.'));
    }

    const isUsdt = paymentMethod === 'USDT (BEP-20)' || currency === 'USDT';
    const ref = (transactionReference || blockchainTxHash || '').trim();

    if (!ref) {
      return next(new ApiError(400, isUsdt ? 'Blockchain TxHash is required for USDT deposit.' : 'Transaction reference/UTR number is required.'));
    }

    // Check duplicate transaction reference or txHash across all non-rejected records
    const existing = await Deposit.findOne({
      $or: [
        { transactionReference: ref },
        { blockchainTxHash: ref }
      ],
      status: { $nin: ['rejected', 'failed', 'REJECTED', 'FAILED'] }
    });

    if (existing) {
      return next(new ApiError(400, 'A deposit with this transaction reference or TxHash has already been submitted or processed.'));
    }

    // ==========================================
    // WORKFLOW A: INR MANUAL REVIEW
    // ==========================================
    if (!isUsdt) {
      // INR deposit enters with PENDING status. Does NOT credit wallet.
      const deposit = await Deposit.create({
        userId: req.user._id,
        amount: numAmount,
        currency: currency || 'INR',
        paymentMethod: paymentMethod || 'UPI',
        transactionReference: ref,
        evidence: evidence || '',
        status: 'pending',
        autoVerified: false
      });

      return res.status(201).json({
        success: true,
        status: 'pending',
        message: `INR Deposit request of ₹${numAmount.toLocaleString('en-IN')} submitted. Awaiting administrative verification.`,
        deposit
      });
    }

    // ==========================================
    // WORKFLOW B: USDT AUTOMATIC BEP-20 VERIFICATION
    // ==========================================
    const txHash = (blockchainTxHash || ref).trim();

    // Perform independent on-chain BEP-20 verification on BNB Smart Chain
    const verification = await verifyUsdtDepositOnChain(
      txHash,
      PLATFORM_USDT_DEPOSIT_ADDRESS,
      numAmount / 100 // USDT equivalent if input in INR, or raw USDT
    );

    let depositStatus = verification.status; // 'approved' | 'confirming' | 'detected' | 'failed' | 'rejected'
    let autoVerified = false;

    const deposit = new Deposit({
      userId: req.user._id,
      amount: numAmount,
      currency: 'USDT',
      paymentMethod: 'USDT (BEP-20)',
      transactionReference: txHash,
      blockchainTxHash: txHash,
      destinationAddress: verification.destinationAddress || PLATFORM_USDT_DEPOSIT_ADDRESS,
      tokenContract: verification.tokenContract || '',
      blockNumber: verification.blockNumber || null,
      confirmations: verification.confirmations || 0,
      status: depositStatus,
      verificationDetails: verification,
      failureReason: verification.reason || ''
    });

    // If fully verified on-chain, automatically credit Main Wallet exactly once
    if (depositStatus === 'approved') {
      deposit.autoVerified = true;
      deposit.reviewedAt = new Date();
      await deposit.save();

      await ledgerService.credit({
        userId: req.user._id,
        walletType: 'main',
        amount: numAmount,
        type: 'deposit',
        referenceId: String(deposit._id),
        description: 'Auto-Verified USDT BEP-20 Deposit',
        subtitle: `Tx: ${txHash.slice(0, 16)}... · BSC Confirmed`,
        txHash
      });

      await AuditLog.create({
        performedBy: req.user._id,
        action: 'AUTO_APPROVE_USDT_DEPOSIT',
        entityType: 'Deposit',
        entityId: deposit._id,
        details: { txHash, amount: numAmount, blockNumber: verification.blockNumber }
      });

      return res.status(201).json({
        success: true,
        status: 'approved',
        message: `USDT deposit of ₹${numAmount.toLocaleString('en-IN')} verified on BNB Smart Chain and credited to Main Wallet.`,
        deposit
      });
    }

    // Awaiting confirmations or newly detected
    await deposit.save();

    res.status(201).json({
      success: true,
      status: depositStatus,
      message: depositStatus === 'confirming'
        ? `USDT deposit detected. Confirming on BNB Smart Chain (${deposit.confirmations}/${deposit.requiredConfirmations} blocks)...`
        : depositStatus === 'failed'
        ? `USDT deposit failed on-chain: ${verification.reason || 'Reverted'}`
        : depositStatus === 'rejected'
        ? `USDT deposit rejected: ${verification.reason || 'Invalid contract/destination'}`
        : 'USDT deposit detected. Awaiting block inclusion.',
      deposit
    });
  } catch (error) {
    next(error);
  }
};

// 2. User/Admin: Recheck/Refresh USDT Deposit Blockchain Status
exports.checkUsdtDepositStatus = async (req, res, next) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) {
      return next(new ApiError(404, 'Deposit record not found.'));
    }

    if (deposit.status === 'approved') {
      return res.json({
        success: true,
        status: 'approved',
        message: 'Deposit has already been verified and credited.',
        deposit
      });
    }

    const verification = await verifyUsdtDepositOnChain(
      deposit.blockchainTxHash || deposit.transactionReference,
      deposit.destinationAddress || PLATFORM_USDT_DEPOSIT_ADDRESS
    );

    deposit.confirmations = verification.confirmations || deposit.confirmations;
    deposit.blockNumber = verification.blockNumber || deposit.blockNumber;
    deposit.verificationDetails = verification;
    deposit.status = verification.status;

    if (verification.status === 'approved' && deposit.status !== 'approved') {
      deposit.status = 'approved';
      deposit.autoVerified = true;
      deposit.reviewedAt = new Date();
      await deposit.save();

      // Credit Main Wallet exactly once
      await ledgerService.credit({
        userId: deposit.userId,
        walletType: 'main',
        amount: deposit.amount,
        type: 'deposit',
        referenceId: String(deposit._id),
        description: 'Auto-Verified USDT BEP-20 Deposit',
        subtitle: `Tx: ${deposit.blockchainTxHash.slice(0, 16)}...`,
        txHash: deposit.blockchainTxHash
      });

      return res.json({
        success: true,
        status: 'approved',
        message: `USDT deposit confirmed on-chain and ₹${deposit.amount.toLocaleString('en-IN')} credited to Main Wallet.`,
        deposit
      });
    }

    if (verification.status === 'failed' || verification.status === 'rejected') {
      deposit.failureReason = verification.reason || '';
    }

    await deposit.save();

    res.json({
      success: true,
      status: deposit.status,
      message: `Deposit status: ${deposit.status}. Confirmations: ${deposit.confirmations}.`,
      deposit
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get User's Own Deposits
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

// 4. Get Deposit by ID
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

// 5. Admin: Get All Deposits (Pending & Processed)
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

// 6. Admin: Mark Under Review (INR Deposits)
exports.underReviewDeposit = async (req, res, next) => {
  try {
    const { reviewNotes } = req.body;
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) {
      return next(new ApiError(404, 'Deposit request not found.'));
    }

    if (deposit.status !== 'pending') {
      return next(new ApiError(400, `Deposit cannot be moved to review from status ${deposit.status}.`));
    }

    deposit.status = 'under_review';
    deposit.reviewedBy = req.user._id;
    deposit.reviewedAt = new Date();
    deposit.reviewNotes = reviewNotes || 'Under compliance review';
    await deposit.save();

    await AuditLog.create({
      performedBy: req.user._id,
      action: 'DEPOSIT_UNDER_REVIEW',
      entityType: 'Deposit',
      entityId: deposit._id,
      details: { reviewNotes: deposit.reviewNotes }
    });

    res.json({
      success: true,
      message: 'Deposit request is now under review.',
      deposit
    });
  } catch (error) {
    next(error);
  }
};

// 7. Admin: Approve Deposit (INR Manual Verification)
exports.approveDeposit = async (req, res, next) => {
  try {
    const { reviewNotes } = req.body;
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) {
      return next(new ApiError(404, 'Deposit request not found.'));
    }

    // Requirement: Do not allow the user to approve their own deposit
    if (deposit.userId.toString() === req.user._id.toString()) {
      return next(new ApiError(403, 'Administrators are strictly prohibited from approving their own deposit requests.'));
    }

    if (deposit.status === 'approved') {
      return next(new ApiError(400, 'Deposit is already approved. Duplicate credits are prevented.'));
    }

    if (deposit.status !== 'pending' && deposit.status !== 'under_review') {
      return next(new ApiError(400, `Deposit cannot be approved from status ${deposit.status}.`));
    }

    // Atomically credit Main Wallet through double-entry ledger
    await ledgerService.credit({
      userId: deposit.userId,
      walletType: 'main',
      amount: deposit.amount,
      type: 'deposit',
      referenceId: String(deposit._id),
      description: `Deposit Approved · ${deposit.paymentMethod}`,
      subtitle: `Ref: ${deposit.transactionReference.slice(0, 16)}... · Approved by Admin`,
      txHash: deposit.blockchainTxHash || deposit.transactionReference
    });

    deposit.status = 'approved';
    deposit.reviewedBy = req.user._id;
    deposit.reviewedAt = new Date();
    deposit.reviewNotes = reviewNotes || 'Payment verified against bank statement/UTR';
    await deposit.save();

    await AuditLog.create({
      performedBy: req.user._id,
      action: 'APPROVE_DEPOSIT',
      entityType: 'Deposit',
      entityId: deposit._id,
      details: {
        amount: deposit.amount,
        userId: deposit.userId,
        reviewNotes: deposit.reviewNotes,
        transactionReference: deposit.transactionReference
      }
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

// 8. Admin: Reject Deposit (INR Manual Review)
exports.rejectDeposit = async (req, res, next) => {
  try {
    const { reviewNotes } = req.body;
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) {
      return next(new ApiError(404, 'Deposit request not found.'));
    }

    if (deposit.status === 'approved') {
      return next(new ApiError(400, 'Approved deposits cannot be rejected. Please use an auditable financial adjustment.'));
    }

    deposit.status = 'rejected';
    deposit.reviewNotes = reviewNotes || 'Invalid or unverifiable payment reference/UTR';
    deposit.reviewedBy = req.user._id;
    deposit.reviewedAt = new Date();
    await deposit.save();

    await AuditLog.create({
      performedBy: req.user._id,
      action: 'REJECT_DEPOSIT',
      entityType: 'Deposit',
      entityId: deposit._id,
      details: {
        amount: deposit.amount,
        userId: deposit.userId,
        reviewNotes: deposit.reviewNotes,
        transactionReference: deposit.transactionReference
      }
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
