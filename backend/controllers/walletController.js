const ledgerService = require('../services/ledgerService');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const ApiError = require('../utils/ApiError');
const depositController = require('./depositController');
const withdrawalController = require('./withdrawalController');

// 1. Get Wallet Balances (Data for Frontend & API)
exports.getWalletBalances = async (req, res, next) => {
  try {
    const wallet = await ledgerService.getOrCreateWallet(req.user._id);
    const wallets = await Wallet.find({ userId: req.user._id });

    res.json({
      success: true,
      balances: {
        main: wallet.mainBalance,
        roi: wallet.roiBalance,
        referral: wallet.referralBalance,
        unc: wallet.uncBalance,
        reserved: wallet.reservedWithdrawal,
        mainBalance: wallet.mainBalance,
        roiBalance: wallet.roiBalance,
        referralBalance: wallet.referralBalance,
        uncBalance: wallet.uncBalance
      },
      wallets
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get All Wallets for User
exports.getWallets = async (req, res, next) => {
  try {
    let wallets = await Wallet.find({ userId: req.user._id });
    if (!wallets || wallets.length === 0) {
      await ledgerService.getOrCreateWallet(req.user._id);
      wallets = await Wallet.find({ userId: req.user._id });
    }
    res.json({
      success: true,
      wallets
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Wallet Summary
exports.getWalletsSummary = async (req, res, next) => {
  try {
    const wallet = await ledgerService.getOrCreateWallet(req.user._id);
    const deposits = await Deposit.aggregate([
      { $match: { userId: req.user._id, status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const withdrawals = await Withdrawal.aggregate([
      { $match: { userId: req.user._id, status: { $in: ['approved', 'paid', 'COMPLETED'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        balances: {
          main: wallet.mainBalance,
          roi: wallet.roiBalance,
          referral: wallet.referralBalance,
          unc: wallet.uncBalance,
          reserved: wallet.reservedWithdrawal
        },
        totalDeposited: deposits[0] ? deposits[0].total : 0,
        totalWithdrawn: withdrawals[0] ? withdrawals[0].total : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Get Transactions by Wallet Type
exports.getWalletTransactions = async (req, res, next) => {
  try {
    const { type } = req.params;
    const normalizedType = (type || 'main').toLowerCase();

    const transactions = await Transaction.find({
      userId: req.user._id,
      walletType: { $in: [normalizedType, normalizedType.toUpperCase()] }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      walletType: normalizedType,
      transactions
    });
  } catch (error) {
    next(error);
  }
};

// 5. Transfer between Wallets (ROI/Referral -> Main)
exports.transferToMainWallet = async (req, res, next) => {
  try {
    const { fromWallet, amount } = req.body;
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
      return next(new ApiError(400, 'Please enter a valid transfer amount.'));
    }

    if (!['roi', 'referral', 'ROI', 'REFERRAL'].includes(fromWallet)) {
      return next(new ApiError(400, 'Source wallet must be ROI or Referral wallet.'));
    }

    const source = fromWallet.toLowerCase();

    // Debit source wallet
    await ledgerService.debit({
      userId: req.user._id,
      walletType: source,
      amount: numAmount,
      type: 'transfer',
      description: `Transfer to Main Wallet`,
      subtitle: `From ${source.toUpperCase()} Wallet (0% Gas Fee)`
    });

    // Credit Main Wallet
    await ledgerService.credit({
      userId: req.user._id,
      walletType: 'main',
      amount: numAmount,
      type: 'transfer',
      description: `Internal Transfer In`,
      subtitle: `Received from ${source.toUpperCase()} Wallet`
    });

    res.json({
      success: true,
      message: `Successfully transferred ₹${numAmount.toLocaleString('en-IN')} to Main Wallet! Ready to invest.`
    });
  } catch (error) {
    next(error);
  }
};

// Export delegation handlers for frontend endpoints
exports.submitDeposit = depositController.submitDeposit;
exports.request2FA = withdrawalController.requestWithdrawalOtp;
exports.submitWithdrawal = withdrawalController.submitWithdrawal;
