const User = require('../models/User');
const Wallet = require('../models/Wallet');
const generateToken = require('../utils/generateToken');
const ApiError = require('../utils/ApiError');
const { sendPasswordResetEmail } = require('../services/emailService');
const crypto = require('crypto');

function generateReferralCode(name) {
  const clean = (name || 'UNC').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${clean}${rand}`;
}

// 1. Register User
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, referralCode, walletAddress } = req.body;

    // Check duplicate email
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return next(new ApiError(400, 'An account with this email address already exists.'));
    }

    // Verify sponsor if provided
    let sponsor = null;
    if (referralCode) {
      sponsor = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (!sponsor) {
        return next(new ApiError(400, 'Invalid referral code. Sponsor not found.'));
      }
    }

    // Generate unique referral code
    let userReferralCode;
    let isUnique = false;
    while (!isUnique) {
      userReferralCode = generateReferralCode(name);
      const collision = await User.findOne({ referralCode: userReferralCode });
      if (!collision) isUnique = true;
    }

    // Role is strictly locked to 'user' on public registration (users cannot self-assign admin)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      referralCode: userReferralCode,
      referredBy: sponsor ? sponsor.referralCode : null,
      walletAddress: walletAddress || '',
      role: 'user',
      status: 'active'
    });

    // Create user wallet record atomically
    await Wallet.create({
      userId: user._id,
      mainBalance: 0,
      roiBalance: 0,
      referralBalance: 0,
      uncBalance: 100 // 100 UNC welcome tokens
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        walletAddress: user.walletAddress,
        kycStatus: user.kycStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Login User
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ApiError(400, 'Please provide email and password.'));
    }

    // Explicitly select password field for verification
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return next(new ApiError(401, 'Invalid email or password.'));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ApiError(401, 'Invalid email or password.'));
    }

    if (user.status === 'suspended') {
      return next(new ApiError(403, 'Your account is suspended. Please contact support.'));
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
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
        rank: user.rank
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Forgot Password (with generic response to prevent email enumeration)
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email ? email.toLowerCase() : '' });

    if (user) {
      // Generate 6-digit verification token
      const resetToken = crypto.randomBytes(20).toString('hex');
      user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins
      await user.save();

      await sendPasswordResetEmail(user.email, resetToken);
    }

    // Always return generic success message to prevent user enumeration
    res.json({
      success: true,
      message: 'If an account matches that email, password reset instructions have been sent.'
    });
  } catch (error) {
    next(error);
  }
};

// 4. Reset Password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return next(new ApiError(400, 'Reset token and new password are required.'));
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(new ApiError(400, 'Invalid or expired password reset token.'));
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful. You may now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

