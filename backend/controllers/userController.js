const User = require('../models/User');
const ApiError = require('../utils/ApiError');

// 1. Get Logged-in User Profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        walletAddress: user.walletAddress,
        web3Connected: user.web3Connected,
        kycStatus: user.kycStatus,
        rank: user.rank,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Update Profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        kycStatus: user.kycStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Change Password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return next(new ApiError(400, 'Current and new password are required.'));
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new ApiError(400, 'Incorrect current password.'));
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// 4. Link/Update Web3 Wallet Address
exports.updateWalletAddress = async (req, res, next) => {
  try {
    const { address, connected } = req.body;
    const user = await User.findById(req.user._id);

    user.walletAddress = address || '';
    user.web3Connected = Boolean(connected);
    await user.save();

    res.json({
      success: true,
      message: connected ? 'BEP-20 wallet connected successfully.' : 'Wallet disconnected.',
      walletAddress: user.walletAddress,
      web3Connected: user.web3Connected
    });
  } catch (error) {
    next(error);
  }
};
