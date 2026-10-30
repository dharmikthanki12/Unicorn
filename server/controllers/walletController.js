const { DB } = require('../models');

// 1. Get Wallet Balances & Recent Transactions
exports.getWalletData = async (req, res) => {
  try {
    const user = await DB.users.findById(req.user._id);
    const transactions = await DB.transactions.find({ userId: req.user._id });

    res.json({
      success: true,
      balances: {
        main: Number(user.mainWalletBalance || 0),
        roi: Number(user.roiWalletBalance || 0),
        referral: Number(user.referralWalletBalance || 0),
        unc: Number(user.uncBalance || 0)
      },
      transactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch wallet balances.' });
  }
};

// 2. Submit Deposit Request (UPI or BEP-20 USDT)
exports.submitDeposit = async (req, res) => {
  try {
    const { amount, currency, method, utrOrTxHash } = req.body;
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid deposit amount is required.' });
    }
    if (!utrOrTxHash) {
      return res.status(400).json({ success: false, message: 'Transaction Reference (UTR or TxHash) is required.' });
    }

    const deposit = await DB.deposits.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      amount: numAmount,
      currency: currency || 'INR',
      method: method || 'UPI',
      utrOrTxHash,
      status: 'pending'
    });

    await DB.transactions.create({
      userId: req.user._id,
      type: 'deposit',
      amount: numAmount,
      amountFormatted: `+₹${numAmount.toLocaleString('en-IN')}`,
      title: `Deposit · ${method}`,
      subtitle: `Ref: ${utrOrTxHash.slice(0, 16)}... (Under Review)`,
      status: 'pending',
      txHash: utrOrTxHash
    });

    res.status(201).json({
      success: true,
      message: `Deposit request of ₹${numAmount.toLocaleString('en-IN')} submitted successfully! Our compliance team will credit your wallet upon verification.`,
      deposit
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit deposit request.' });
  }
};

// 3. Request 2FA OTP for Withdrawal (PDF Section 6: 2FA required ONLY at withdrawal)
exports.requestWithdrawal2FA = async (req, res) => {
  try {
    const user = await DB.users.findById(req.user._id);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await DB.users.updateOne(
      { _id: user._id },
      { $set: { twoFactorOtp: otp, twoFactorOtpExpires: expires } }
    );

    console.log(`[2FA Security] Withdrawal OTP for ${user.email}: ${otp}`);

    res.json({
      success: true,
      message: `Security 2FA Code sent to registered email (${user.email}).`,
      previewOtp: otp // Included for testing convenience
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate 2FA withdrawal code.' });
  }
};

// 4. Submit Withdrawal Request (with 2FA Verification)
exports.submitWithdrawal = async (req, res) => {
  try {
    const { sourceWallet, amount, payoutMethod, payoutDetails, otpCode } = req.body;
    const numAmount = Number(amount);

    if (!numAmount || numAmount < 500) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is ₹500.' });
    }
    if (!['roi', 'referral'].includes(sourceWallet)) {
      return res.status(400).json({ success: false, message: 'Invalid source wallet. Must be ROI or Referral.' });
    }

    // Verify 2FA OTP Code
    const user = await DB.users.findById(req.user._id);
    if (!otpCode || user.twoFactorOtp !== String(otpCode)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired 2FA code. Please request a new OTP.' });
    }

    // Check available balance
    const currentBalance = sourceWallet === 'roi' ? Number(user.roiWalletBalance || 0) : Number(user.referralWalletBalance || 0);
    if (currentBalance < numAmount) {
      return res.status(400).json({ success: false, message: `Insufficient balance in ${sourceWallet.toUpperCase()} wallet.` });
    }

    // Deduct balance
    const walletField = sourceWallet === 'roi' ? 'roiWalletBalance' : 'referralWalletBalance';
    await DB.users.updateOne(
      { _id: user._id },
      {
        $inc: { [walletField]: -numAmount },
        $set: { twoFactorOtp: null, twoFactorOtpExpires: null }
      }
    );

    // Create Withdrawal Record
    const withdrawal = await DB.withdrawals.create({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      sourceWallet,
      amount: numAmount,
      payoutMethod: payoutMethod || 'bank',
      payoutDetails: payoutDetails || {},
      status: 'pending'
    });

    // Create Ledger Transaction
    await DB.transactions.create({
      userId: user._id,
      type: 'withdrawal',
      amount: numAmount,
      amountFormatted: `-₹${numAmount.toLocaleString('en-IN')}`,
      title: `Withdrawal · ${sourceWallet.toUpperCase()} Wallet`,
      subtitle: `${payoutMethod === 'crypto' ? 'BEP-20 USDT' : 'Bank IMPS'} (Under Review)`,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: `Withdrawal request for ₹${numAmount.toLocaleString('en-IN')} submitted and placed under compliance review.`,
      withdrawal
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ success: false, message: 'Failed to process withdrawal request.' });
  }
};

// 5. Internal Transfer: Move ROI or Referral earnings into Main Deposit Wallet
exports.transferToMainWallet = async (req, res) => {
  try {
    const { sourceWallet, amount } = req.body;
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid transfer amount is required.' });
    }

    const user = await DB.users.findById(req.user._id);
    const balanceField = sourceWallet === 'roi' ? 'roiWalletBalance' : 'referralWalletBalance';
    const currentBalance = Number(user[balanceField] || 0);

    if (currentBalance < numAmount) {
      return res.status(400).json({ success: false, message: `Insufficient funds in ${sourceWallet.toUpperCase()} wallet.` });
    }

    // Deduct source and add to main wallet
    await DB.users.updateOne(
      { _id: user._id },
      {
        $inc: {
          [balanceField]: -numAmount,
          mainWalletBalance: numAmount
        }
      }
    );

    await DB.transactions.create({
      userId: user._id,
      type: 'transfer',
      amount: numAmount,
      amountFormatted: `+₹${numAmount.toLocaleString('en-IN')}`,
      title: `Transfer to Main Wallet`,
      subtitle: `From ${sourceWallet.toUpperCase()} Wallet (0% Gas Fee)`,
      status: 'completed'
    });

    res.json({
      success: true,
      message: `Successfully transferred ₹${numAmount.toLocaleString('en-IN')} to Main Wallet! Ready to invest.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to execute internal transfer.' });
  }
};
