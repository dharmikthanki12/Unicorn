const Package = require('../models/Package');
const ApiError = require('../utils/ApiError');

const DEFAULT_PACKAGES = [
  { id: 'starter', tier: 1, name: 'Starter Package', amount: 10000, usdValue: 100, dailyRoiRate: 0.0045, dailyReturn: 45, monthlyReturn: 990, bonusUnc: 1000, tag: 'Beginner', color: '#8A70D6' },
  { id: 'basic', tier: 2, name: 'Basic Growth', amount: 50000, usdValue: 500, dailyRoiRate: 0.0045, dailyReturn: 225, monthlyReturn: 4950, bonusUnc: 5000, tag: 'Popular', color: '#A06BD5' },
  { id: 'pro', tier: 3, name: 'Pro Trader', amount: 250000, usdValue: 2500, dailyRoiRate: 0.0045, dailyReturn: 1125, monthlyReturn: 24750, bonusUnc: 25000, tag: 'Advanced', color: '#B55CA9' },
  { id: 'premium', tier: 4, name: 'Premium Wealth', amount: 500000, usdValue: 5000, dailyRoiRate: 0.0045, dailyReturn: 2250, monthlyReturn: 49500, bonusUnc: 50000, tag: 'Active Plan', color: '#C46DB2' },
  { id: 'elite', tier: 5, name: 'Elite Portfolio', amount: 1000000, usdValue: 10000, dailyRoiRate: 0.0045, dailyReturn: 4500, monthlyReturn: 99000, bonusUnc: 100000, tag: 'High Yield', color: '#D854A8' },
  { id: 'platinum', tier: 6, name: 'Platinum Staking', amount: 2500000, usdValue: 25000, dailyRoiRate: 0.0045, dailyReturn: 11250, monthlyReturn: 247500, bonusUnc: 250000, tag: 'Institutional', color: '#E06BB0' },
  { id: 'vip', tier: 7, name: 'VIP Unicorn', amount: 5000000, usdValue: 50000, dailyRoiRate: 0.0045, dailyReturn: 22500, monthlyReturn: 495000, bonusUnc: 500000, tag: 'Max Tier', color: '#A655D0' }
];

// Helper to ensure packages exist
async function ensurePackagesExist() {
  const count = await Package.countDocuments();
  if (count === 0) {
    for (const p of DEFAULT_PACKAGES) {
      await Package.create(p);
    }
  }
}

// 1. Get All Active Packages
exports.getPackages = async (req, res, next) => {
  try {
    await ensurePackagesExist();
    const packages = await Package.find({ status: 'active' }).sort({ tier: 1 });
    res.json({
      success: true,
      packages
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Single Package
exports.getPackageById = async (req, res, next) => {
  try {
    const pkg = await Package.findOne({ id: req.params.id }) || await Package.findById(req.params.id);
    if (!pkg) {
      return next(new ApiError(404, 'Investment package not found.'));
    }
    res.json({
      success: true,
      package: pkg
    });
  } catch (error) {
    next(error);
  }
};

// 3. Admin: Create Package
exports.createPackage = async (req, res, next) => {
  try {
    const pkg = await Package.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Package created successfully.',
      package: pkg
    });
  } catch (error) {
    next(error);
  }
};

// 4. Admin: Update Package
exports.updatePackage = async (req, res, next) => {
  try {
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!pkg) {
      return next(new ApiError(404, 'Package not found.'));
    }
    res.json({
      success: true,
      message: 'Package updated successfully.',
      package: pkg
    });
  } catch (error) {
    next(error);
  }
};

// 5. Admin: Toggle Status
exports.toggleStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const pkg = await Package.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!pkg) {
      return next(new ApiError(404, 'Package not found.'));
    }
    res.json({
      success: true,
      message: `Package status updated to ${status}.`,
      package: pkg
    });
  } catch (error) {
    next(error);
  }
};
