const { DB, INVESTMENT_PACKAGES } = require('../models');
const { propagateTeamBusiness } = require('../services/rankRewardEngine');
const { DAILY_ROI_RATE } = require('../config/constants');

// 1. Get Packages
exports.getPackages = async (req, res) => {
  res.json({
    success: true,
    packages: INVESTMENT_PACKAGES
  });
};

// 2. Invest in Package (PDF Section 2)
exports.investPackage = async (req, res) => {
  try {
    const { packageId } = req.body;
    const pkg = INVESTMENT_PACKAGES.find(p => p.id === packageId);

    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Selected investment package not found.' });
    }

    const user = await DB.users.findById(req.user._id);
    const cost = Number(pkg.amount);

    if (Number(user.mainWalletBalance || 0) < cost) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance in Main Deposit Wallet! Need ₹${cost.toLocaleString('en-IN')}, available ₹${Number(user.mainWalletBalance || 0).toLocaleString('en-IN')}.`
      });
    }

    const dailyRoi = Math.round(cost * DAILY_ROI_RATE); // 0.45%

    // 1. Deduct funds and credit active investment + bonus UNC tokens
    await DB.users.updateOne(
      { _id: user._id },
      {
        $inc: {
          mainWalletBalance: -cost,
          activeInvestedAmount: cost,
          uncBalance: pkg.bonusUnc
        }
      }
    );

    // 2. Create Active Investment Record
    const investment = await DB.investments.create({
      userId: user._id,
      packageId: pkg.id,
      packageName: pkg.name,
      tier: pkg.tier,
      amount: cost,
      dailyRoi,
      bonusUnc: pkg.bonusUnc,
      status: 'active'
    });

    // 3. Record in Ledger
    await DB.transactions.create({
      userId: user._id,
      type: 'transfer',
      amount: cost,
      amountFormatted: `-₹${cost.toLocaleString('en-IN')}`,
      title: `Activated ${pkg.name}`,
      subtitle: `Tier ${pkg.tier} · Earns +₹${dailyRoi}/day (0.45% Daily ROI)`,
      status: 'completed'
    });

    // 4. Propagate team volume to uplines for Rank Rewards & Achiever Trips
    await propagateTeamBusiness(user._id, cost);

    const updatedUser = await DB.users.findById(user._id);

    res.status(201).json({
      success: true,
      message: `Successfully activated ${pkg.name}! You earn ₹${dailyRoi.toLocaleString('en-IN')}/day starting next cycle, plus +${pkg.bonusUnc.toLocaleString('en-IN')} UNC tokens.`,
      investment,
      newBalances: {
        main: updatedUser.mainWalletBalance,
        activeInvested: updatedUser.activeInvestedAmount,
        unc: updatedUser.uncBalance
      }
    });
  } catch (error) {
    console.error('Invest error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete package activation.' });
  }
};

// 3. Get Active User Investments
exports.getUserInvestments = async (req, res) => {
  try {
    const investments = await DB.investments.find({ userId: req.user._id });
    res.json({
      success: true,
      investments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch investments.' });
  }
};
