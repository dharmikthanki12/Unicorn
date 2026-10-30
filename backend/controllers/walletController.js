const ledgerService = require('../services/ledgerService');
const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');

// 1. Get Wallet Balances
exports.getWalletBalances = async (req, res, next) => {
  try {
    const wallet = await ledgerService.getOrCreateWallet(req.user._id);
    res.json({
      success: true,
      balances: {
        main: wallet.mainBalance,
        roi: wallet.roiBalance,
        referral: wallet.referralBalance,
        unc: wallet.uncBalance,
        reserved: wallet.reservedWithdrawal
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Transfer between Wallets (e.g. ROI or Referral -> Main Deposit Wallet)
exports.transferToMainWallet = async (req, res, next) => {
  try {
    const { fromWallet, amount } = req.body;
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
      return next(new ApiError(400, 'Please enter a valid transfer amount.'));
    }

    if (!['roi', 'referral'].includes(fromWallet)) {
      return next(new ApiError(400, 'Source wallet must be ROI or Referral wallet.'));
    }

    // Debit source wallet
    await ledgerService.debit({
      userId: req.user._id,
      walletType: fromWallet,
      amount: numAmount,
      type: 'transfer',
      description: `Transfer to Main Wallet`,
      subtitle: `From ${fromWallet.toUpperCase()} Wallet (0% Gas Fee)`
    });

    // Credit Main Wallet
    await ledgerService.credit({
      userId: req.user._id,
      walletType: 'main',
      amount: numAmount,
      type: 'transfer',
      description: `Internal Transfer In`,
      subtitle: `Received from ${fromWallet.toUpperCase()} Wallet`
    });

    res.json({
      success: true,
      message: `Successfully transferred ₹${numAmount.toLocaleString('en-IN')} to Main Wallet! Ready to invest.`
    });
  } catch (error) {
    next(error);
  }
};

