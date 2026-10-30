const ledgerService = require('../services/ledgerService');
const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');

exports.getDashboardData = async (req, res, next) => {
  try {
    const wallet = await ledgerService.getOrCreateWallet(req.user._id);

    // Active investments
    const activeInvestments = await Investment.find({ userId: req.user._id, status: 'confirmed' });
    const activeInvestedAmount = activeInvestments.reduce((acc, i) => acc + Number(i.amount || 0), 0);
    const todayRoiIncome = activeInvestments.reduce((acc, i) => acc + Number(i.dailyRoiAmount || 0), 0);

    // Latest transactions
    const recentTransactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(6);

    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          referralCode: req.user.referralCode,
          rank: req.user.rank,
          kycStatus: req.user.kycStatus,
          walletAddress: req.user.walletAddress,
          web3Connected: req.user.web3Connected
        },
        balances: {
          main: wallet.mainBalance,
          roi: wallet.roiBalance,
          referral: wallet.referralBalance,
          unc: wallet.uncBalance
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
