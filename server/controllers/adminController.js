const { DB } = require('../models');
const { processDailyROI } = require('../services/roiEngine');

// 1. Get Admin Dashboard Metrics
exports.getAdminMetrics = async (req, res) => {
  try {
    const allUsers = await DB.users.find();
    const deposits = await DB.deposits.find();
    const withdrawals = await DB.withdrawals.find();
    const investments = await DB.investments.find({ status: 'active' });

    let totalVolume = 0;
    let totalDeposited = 0;
    let totalWithdrawn = 0;

    deposits.forEach(d => {
      if (d.status === 'approved') totalDeposited += Number(d.amount || 0);
    });
    withdrawals.forEach(w => {
      if (w.status === 'approved') totalWithdrawn += Number(w.amount || 0);
    });
    investments.forEach(i => {
      totalVolume += Number(i.amount || 0);
    });

    const pendingDeposits = deposits.filter(d => d.status === 'pending');
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');

    res.json({
      success: true,
      metrics: {
        totalUsers: allUsers.length,
        activeStakedVolume: totalVolume,
        totalDeposited,
        totalWithdrawn,
        pendingDepositsCount: pendingDeposits.length,
        pendingWithdrawalsCount: pendingWithdrawals.length,
        totalInvestmentsCount: investments.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin metrics.' });
  }
};

// 2. Get All Users List
exports.getAllUsers = async (req, res) => {
  try {
    const users = await DB.users.find();
    res.json({
      success: true,
      users: users.map(u => ({
        id: u._id || u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        referralCode: u.referralCode,
        referredBy: u.referredBy,
        mainWalletBalance: u.mainWalletBalance || 0,
        roiWalletBalance: u.roiWalletBalance || 0,
        referralWalletBalance: u.referralWalletBalance || 0,
        activeInvestedAmount: u.activeInvestedAmount || 0,
        kycStatus: u.kycStatus || 'Verified',
        rank: u.rank || 'Bronze Leader',
        directsCount: u.directsCount || 0,
        createdAt: u.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users list.' });
  }
};

// 3. Get Deposit Requests
exports.getDeposits = async (req, res) => {
  try {
    const deposits = await DB.deposits.find();
    res.json({ success: true, deposits });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch deposits.' });
  }
};

// 4. Approve Deposit Request
exports.approveDeposit = async (req, res) => {
  try {
    const { depositId } = req.params;
    const deposit = await DB.deposits.findById(depositId);

    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit request not found.' });
    }
    if (deposit.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Deposit request is already ${deposit.status}.` });
    }

    // Credit user's Main Deposit Wallet
    await DB.users.updateOne(
      { _id: deposit.userId },
      { $inc: { mainWalletBalance: Number(deposit.amount) } }
    );

    // Update status to approved
    await DB.deposits.updateOne(
      { _id: depositId },
      { $set: { status: 'approved' } }
    );

    // Record completed transaction
    await DB.transactions.create({
      userId: deposit.userId,
      type: 'deposit',
      amount: deposit.amount,
      amountFormatted: `+₹${deposit.amount.toLocaleString('en-IN')}`,
      title: `Deposit Approved · ${deposit.method}`,
      subtitle: `Credited to Main Wallet (Ref: ${deposit.utrOrTxHash.slice(0, 14)}...)`,
      status: 'completed',
      txHash: deposit.utrOrTxHash
    });

    res.json({
      success: true,
      message: `Deposit of ₹${deposit.amount.toLocaleString('en-IN')} approved and credited to ${deposit.userName}'s wallet.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve deposit.' });
  }
};

// 5. Reject Deposit Request
exports.rejectDeposit = async (req, res) => {
  try {
    const { depositId } = req.params;
    const deposit = await DB.deposits.findById(depositId);

    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit request not found.' });
    }

    await DB.deposits.updateOne(
      { _id: depositId },
      { $set: { status: 'rejected' } }
    );

    res.json({
      success: true,
      message: `Deposit request for ₹${deposit.amount.toLocaleString('en-IN')} rejected.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject deposit.' });
  }
};

// 6. Get Withdrawal Requests
exports.getWithdrawals = async (req, res) => {
  try {
    const withdrawals = await DB.withdrawals.find();
    res.json({ success: true, withdrawals });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch withdrawals.' });
  }
};

// 7. Approve Withdrawal Request
exports.approveWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { txHash } = req.body;
    const withdrawal = await DB.withdrawals.findById(withdrawalId);

    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found.' });
    }
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Withdrawal request is already ${withdrawal.status}.` });
    }

    await DB.withdrawals.updateOne(
      { _id: withdrawalId },
      {
        $set: {
          status: 'approved',
          payoutTxHash: txHash || '0x' + Math.random().toString(16).substring(2, 42)
        }
      }
    );

    res.json({
      success: true,
      message: `Withdrawal of ₹${withdrawal.amount.toLocaleString('en-IN')} approved and disbursed.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve withdrawal.' });
  }
};

// 8. Reject Withdrawal Request (Refunds money back to user's wallet)
exports.rejectWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const withdrawal = await DB.withdrawals.findById(withdrawalId);

    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found.' });
    }
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Withdrawal request is already ${withdrawal.status}.` });
    }

    // Refund funds back to the original source wallet (ROI or Referral)
    const walletField = withdrawal.sourceWallet === 'roi' ? 'roiWalletBalance' : 'referralWalletBalance';
    await DB.users.updateOne(
      { _id: withdrawal.userId },
      { $inc: { [walletField]: Number(withdrawal.amount) } }
    );

    await DB.withdrawals.updateOne(
      { _id: withdrawalId },
      { $set: { status: 'rejected' } }
    );

    await DB.transactions.create({
      userId: withdrawal.userId,
      type: 'refund',
      amount: withdrawal.amount,
      amountFormatted: `+₹${withdrawal.amount.toLocaleString('en-IN')}`,
      title: `Withdrawal Rejected (Refunded)`,
      subtitle: `Credited back to ${withdrawal.sourceWallet.toUpperCase()} Wallet`,
      status: 'completed'
    });

    res.json({
      success: true,
      message: `Withdrawal rejected. ₹${withdrawal.amount.toLocaleString('en-IN')} refunded to ${withdrawal.userName}'s wallet.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject withdrawal.' });
  }
};

// 9. Manual Trigger for Daily ROI & Referral Distribution Engine
exports.triggerDailyROI = async (req, res) => {
  try {
    const result = await processDailyROI();
    res.json({
      success: true,
      message: `Daily ROI & Multi-level referral cycle processed successfully!`,
      ...result
    });
  } catch (error) {
    console.error('Trigger ROI error:', error);
    res.status(500).json({ success: false, message: 'Failed to process Daily ROI cycle.' });
  }
};
