const Investment = require('../models/Investment');
const Package = require('../models/Package');
const ledgerService = require('../services/ledgerService');
const { evaluateAndAwardRewards } = require('../services/rewardService');
const ApiError = require('../utils/ApiError');

// 1. Create / Activate Investment Package
exports.createInvestment = async (req, res, next) => {
  try {
    const { packageId, paymentMethod, transactionReference } = req.body;

    const pkg = await Package.findOne({ id: packageId }) || await Package.findById(packageId);
    if (!pkg || pkg.status !== 'active') {
      return next(new ApiError(404, 'Selected investment package is not active or not found.'));
    }

    const cost = Number(pkg.amount);
    const dailyRoiAmount = Math.round(cost * (pkg.dailyRoiRate || 0.0045));

    // Atomically debit Main Wallet through ledger service (fails if balance is insufficient)
    await ledgerService.debit({
      userId: req.user._id,
      walletType: 'main',
      amount: cost,
      type: 'invest',
      referenceId: pkg.id,
      description: `Package Activation · ${pkg.name}`,
      subtitle: `Tier ${pkg.tier} (0.45% Daily ROI)`
    });

    // Credit bonus UNC tokens (BEP-20)
    if (pkg.bonusUnc > 0) {
      await ledgerService.credit({
        userId: req.user._id,
        walletType: 'unc',
        amount: pkg.bonusUnc,
        type: 'roi_credit',
        description: `Bonus UNC Tokens · ${pkg.name}`,
        subtitle: `Tier ${pkg.tier} Welcome Reward`
      });
    }

    // Create confirmed Investment record
    const investment = await Investment.create({
      userId: req.user._id,
      packageId: pkg.id,
      packageName: pkg.name,
      tier: pkg.tier,
      amount: cost,
      dailyRoiRate: pkg.dailyRoiRate,
      dailyRoiAmount,
      bonusUnc: pkg.bonusUnc,
      status: 'confirmed',
      paymentMethod: paymentMethod || 'main_wallet',
      transactionReference: transactionReference || '',
      startDate: new Date()
    });

    // Trigger Rank & Achiever evaluations for user and uplines
    await evaluateAndAwardRewards(req.user);

    res.status(201).json({
      success: true,
      message: `Successfully activated ${pkg.name}! Fixed Daily ROI of ₹${dailyRoiAmount.toLocaleString('en-IN')} (0.45%) begins next cycle.`,
      investment
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get User Investments
exports.getMyInvestments = async (req, res, next) => {
  try {
    const investments = await Investment.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      investments
    });
  } catch (error) {
    next(error);
  }
};

// 2b. Get Investment by ID
exports.getInvestmentById = async (req, res, next) => {
  try {
    const investment = await Investment.findById(req.params.id);
    if (!investment) {
      return next(new ApiError(404, 'Investment not found.'));
    }
    res.json({
      success: true,
      investment
    });
  } catch (error) {
    next(error);
  }
};

// 3. Admin: Get All Platform Investments
exports.getAllInvestments = async (req, res, next) => {
  try {
    const investments = await Investment.find().populate('userId', 'name email referralCode').sort({ createdAt: -1 });
    res.json({
      success: true,
      investments
    });
  } catch (error) {
    next(error);
  }
};

