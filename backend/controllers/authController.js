const mongoose = require('mongoose');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const EmailOtp = require('../models/EmailOtp');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const ApiError = require('../utils/ApiError');
const { sendPasswordResetEmail, sendEmailVerificationOtp } = require('../services/emailService');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');

function generateReferralCode(name) {
  const clean = (name || 'UNC').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${clean}${rand}`;
}

async function getUserBalances(userId) {
  try {
    const wallets = await Wallet.find({ userId });
    const mainWallet = wallets.find(w => w.type === 'MAIN' || w.type === 'main');
    const roiWallet = wallets.find(w => w.type === 'ROI' || w.type === 'roi');
    const referralWallet = wallets.find(w => w.type === 'REFERRAL' || w.type === 'referral');
    return {
      mainWalletBalance: mainWallet ? Number(mainWallet.balance || mainWallet.balanceINR || 0) : 0,
      roiWalletBalance: roiWallet ? Number(roiWallet.balance || roiWallet.balanceINR || 0) : 0,
      referralWalletBalance: referralWallet ? Number(referralWallet.balance || referralWallet.balanceINR || 0) : 0
    };
  } catch (e) {
    return { mainWalletBalance: 0, roiWalletBalance: 0, referralWalletBalance: 0 };
  }
}

async function getUserInvestmentStats(user) {
  try {
    const Investment = require('../models/Investment');
    const activeInvestments = await Investment.find({
      userId: user._id,
      status: { $in: ['confirmed', 'ACTIVE', 'CONFIRMED', 'active'] }
    }).sort({ createdAt: -1 });

    const totalFromInvestments = activeInvestments.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const activeInvestedAmount = Math.max(Number(user.activeInvestedAmount || 0), totalFromInvestments);
    const isReferralActivated = Boolean(user.isReferralActivated || activeInvestedAmount > 0 || activeInvestments.length > 0);
    const todayRoiIncome = activeInvestments.reduce((acc, i) => acc + (Number(i.dailyRoiAmount) || 0), 0);

    // Auto-heal User record in DB if it was missing the referral activation flag
    if ((!user.isReferralActivated && isReferralActivated) || (!user.activeInvestedAmount && activeInvestedAmount > 0)) {
      try {
        await User.findByIdAndUpdate(user._id, {
          $set: { isReferralActivated: true, activeInvestedAmount }
        });
      } catch (saveErr) {}
    }

    const directs = await User.find({ referredBy: user.referralCode });
    const directIds = directs.map(d => d._id);
    const directInvs = await Investment.find({
      userId: { $in: directIds },
      status: { $in: ['confirmed', 'ACTIVE', 'CONFIRMED', 'active'] }
    });
    const directBusiness = directInvs.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);

    return {
      activeInvestedAmount,
      isReferralActivated,
      todayRoiIncome,
      directBusiness,
      teamBusiness: directBusiness,
      totalDirects: directs.length,
      activePackage: activeInvestments[0] || null
    };
  } catch (err) {
    console.warn('[Investment Stats Error]:', err.message);
    const isRef = Boolean(user.isReferralActivated || (user.activeInvestedAmount && user.activeInvestedAmount > 0));
    return {
      activeInvestedAmount: Number(user.activeInvestedAmount || 0),
      isReferralActivated: isRef,
      todayRoiIncome: 0,
      directBusiness: 0,
      teamBusiness: 0,
      totalDirects: 0,
      activePackage: null
    };
  }
}

// 0a. Send Email Verification OTP
exports.sendEmailOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next(new ApiError(400, 'Please provide a valid email address.'));
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return next(new ApiError(400, 'An account with this email address already exists. Please sign in instead.'));
    }

    // Generate 6 digit numeric code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in EmailOtp collection (invalidate older OTPs for this email)
    await EmailOtp.deleteMany({ email: cleanEmail });
    await EmailOtp.create({
      email: cleanEmail,
      otp,
      expiresAt
    });

    // Send real email via emailService
    await sendEmailVerificationOtp(cleanEmail, otp);

    res.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}. Please check your email inbox (and spam folder).`,
      email: cleanEmail
    });
  } catch (error) {
    next(error);
  }
};

// 0b. Verify Email OTP
exports.verifyEmailOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return next(new ApiError(400, 'Please provide both email and 6-digit OTP code.'));
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    const record = await EmailOtp.findOne({ email: cleanEmail }).sort({ createdAt: -1 });
    if (!record) {
      return next(new ApiError(400, 'No verification request found for this email. Please request a new OTP.'));
    }

    if (new Date() > record.expiresAt) {
      return next(new ApiError(400, 'Verification code has expired. Please request a new OTP.'));
    }

    if (record.otp !== cleanOtp) {
      return next(new ApiError(400, 'Invalid verification code. Please check your email and try again.'));
    }

    const verificationToken = crypto.randomBytes(24).toString('hex');
    record.isVerified = true;
    record.verificationToken = verificationToken;
    await record.save();

    res.json({
      success: true,
      message: 'Email address verified successfully!',
      email: cleanEmail,
      verificationToken
    });
  } catch (error) {
    next(error);
  }
};

// 1. Register User (Supports Email OR Phone Number)
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, referralCode, walletAddress, signupMethod } = req.body;

    // Ensure database connection is active - do NOT allow phantom registrations
    if (mongoose.connection.readyState !== 1) {
      return next(new ApiError(503, 'Database is not connected. Unable to register user in MongoDB.'));
    }

    if (!password || password.length < 6) {
      return next(new ApiError(400, 'Password must be at least 6 characters.'));
    }

    const cleanPhone = phone ? String(phone).trim() : '';
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    let cleanEmail = email ? String(email).trim().toLowerCase() : '';

    const isPhoneSignup = signupMethod === 'phone' || (!cleanEmail && cleanPhone);

    if (isPhoneSignup) {
      if (!cleanPhone || digitsOnly.length < 8) {
        return next(new ApiError(400, 'Please provide a valid mobile phone number (at least 8 digits).'));
      }

      // Check duplicate phone
      const existingPhone = await User.findOne({
        $or: [
          { phone: cleanPhone },
          { phone: cleanPhone.replace(/[\s\-\(\)]/g, '') },
          { phone: `+${digitsOnly}` },
          { phone: { $regex: `${digitsOnly.slice(-10)}$` } }
        ]
      });
      if (existingPhone) {
        return next(new ApiError(400, 'An account with this phone number already exists. Please sign in instead.'));
      }

      // If user registered with phone without email, assign clean unique fallback email
      if (!cleanEmail) {
        cleanEmail = `${digitsOnly}@unicorn.vip`;
      }
    } else {
      // Email signup
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return next(new ApiError(400, 'Please provide a valid email address.'));
      }
    }

    // Check duplicate email
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return next(new ApiError(400, 'An account with this email address already exists. Please sign in instead.'));
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
    const baseName = name || (cleanPhone ? `User${digitsOnly.slice(-4)}` : 'UNC');
    while (!isUnique) {
      userReferralCode = generateReferralCode(baseName);
      const collision = await User.findOne({ referralCode: userReferralCode });
      if (!collision) isUnique = true;
    }

    const finalName = (name && name.trim()) || (cleanPhone ? `User ${digitsOnly.slice(-4)}` : 'Investor');

    // Create user with UNVERIFIED KYC status (requires Admin review & approval)
    const user = await User.create({
      name: finalName,
      email: cleanEmail,
      password,
      phone: cleanPhone || '',
      isEmailVerified: true,
      referralCode: userReferralCode,
      referredBy: sponsor ? sponsor.referralCode : null,
      sponsorId: sponsor ? sponsor._id : null,
      walletAddress: walletAddress ? walletAddress.trim() : null,
      role: 'user',
      status: 'active',
      rank: 'Starter Unicorn',
      kycStatus: 'UNVERIFIED',
      kycVerified: false,
      lastLoginAt: new Date()
    });

    // Create 3 isolated wallets atomically: MAIN, REFERRAL, ROI
    await Wallet.create([
      {
        userId: user._id,
        type: 'MAIN',
        balance: 0,
        balanceINR: 0,
        balanceUNC: 100, // 100 UNC welcome tokens
        lockedBalance: 0,
        reservedWithdrawal: 0,
        mainBalance: 0,
        uncBalance: 100
      },
      {
        userId: user._id,
        type: 'REFERRAL',
        balance: 0,
        balanceINR: 0,
        balanceUNC: 0,
        lockedBalance: 0,
        reservedWithdrawal: 0,
        referralBalance: 0
      },
      {
        userId: user._id,
        type: 'ROI',
        balance: 0,
        balanceINR: 0,
        balanceUNC: 0,
        lockedBalance: 0,
        reservedWithdrawal: 0
      }
    ]);

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token: accessToken,
      accessToken,
      refreshToken,
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

// 2. Login User (Supports Email OR Phone Number)
exports.login = async (req, res, next) => {
  try {
    const { email, phone, identifier, password } = req.body;
    const loginId = (identifier || email || phone || '').trim();

    if (!loginId || !password) {
      return next(new ApiError(400, 'Please provide email or phone number and password.'));
    }

    // Ensure database connection is active - do NOT allow phantom logins
    if (mongoose.connection.readyState !== 1) {
      return next(new ApiError(503, 'Database is not connected. Unable to verify credentials in MongoDB.'));
    }

    let user;
    if (loginId.includes('@')) {
      // Login with Email
      user = await User.findOne({ email: loginId.toLowerCase() }).select('+password');
    } else {
      // Login with Phone Number
      const cleanPhone = loginId.replace(/[\s\-\(\)]/g, '');
      const digitsOnly = loginId.replace(/\D/g, '');
      const phoneQueries = [
        { phone: loginId },
        { phone: cleanPhone },
        { phone: `+${cleanPhone.replace(/^\+/, '')}` }
      ];
      if (digitsOnly.length >= 7) {
        phoneQueries.push({ phone: { $regex: `${digitsOnly.slice(-10)}$` } });
        phoneQueries.push({ email: `${digitsOnly}@unicorn.vip` });
      }
      user = await User.findOne({ $or: phoneQueries }).select('+password');
    }

    if (!user) {
      return next(new ApiError(401, 'Invalid email/phone or password.'));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ApiError(401, 'Invalid email/phone or password.'));
    }

    if (user.status === 'suspended' || user.status === 'SUSPENDED') {
      return next(new ApiError(403, 'Your account is suspended. Please contact support.'));
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    try {
      await User.findByIdAndUpdate(user._id, {
        $set: { refreshToken, lastLoginAt: new Date() }
      });
    } catch (saveErr) {
      console.warn('[Login Token Save Notice]:', saveErr.message);
    }

    const balances = await getUserBalances(user._id);
    const invStats = await getUserInvestmentStats(user);

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token: accessToken,
      accessToken,
      refreshToken,
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
        mainWalletBalance: balances.mainWalletBalance,
        roiWalletBalance: balances.roiWalletBalance,
        referralWalletBalance: balances.referralWalletBalance,
        activeInvestedAmount: invStats.activeInvestedAmount,
        isReferralActivated: invStats.isReferralActivated,
        todayRoiIncome: invStats.todayRoiIncome,
        directBusiness: invStats.directBusiness,
        teamBusiness: invStats.teamBusiness,
        totalDirects: invStats.totalDirects,
        activePackage: invStats.activePackage
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Refresh Token
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return next(new ApiError(400, 'Refresh token is required.'));
    }

    const secret = process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET || 'unicorn_super_secret') + '_refresh';
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, secret);
    } catch (err) {
      return next(new ApiError(401, 'Invalid or expired refresh token. Please log in again.'));
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return next(new ApiError(401, 'Refresh token has been revoked or is invalid.'));
    }

    // Token rotation
    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Token refreshed successfully.',
      token: newAccessToken,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    next(error);
  }
};

// 4. Logout User (Revokes refresh token)
exports.logout = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : req.body.userId;
    if (userId) {
      await User.findByIdAndUpdate(userId, { refreshToken: null });
    }
    res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// 5. Web3 Wallet Nonce Generation
exports.getWalletNonce = async (req, res, next) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      return next(new ApiError(400, 'walletAddress is required.'));
    }

    const nonce = `Sign this message to authenticate with UNICORN Web3 Protocol: ${crypto.randomBytes(16).toString('hex')}`;
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

    if (user) {
      user.walletNonce = nonce;
      await user.save();
    }

    res.json({
      success: true,
      nonce,
      message: nonce
    });
  } catch (error) {
    next(error);
  }
};

// 6. Web3 Wallet Signature Verification
exports.verifyWalletSignature = async (req, res, next) => {
  try {
    const { walletAddress, signature, nonce } = req.body;
    if (!walletAddress || !signature) {
      return next(new ApiError(400, 'walletAddress and signature are required.'));
    }

    const messageToVerify = nonce || 'Sign this message to authenticate with UNICORN Web3 Protocol';
    
    // Verify cryptographic signature via ethers
    const recoveredAddress = ethers.verifyMessage(messageToVerify, signature);
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return next(new ApiError(401, 'Invalid cryptographic wallet signature.'));
    }

    // Find or create user for this wallet
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (!user) {
      let uniqueCode;
      let isUnique = false;
      while (!isUnique) {
        uniqueCode = generateReferralCode('UNC');
        const collision = await User.findOne({ referralCode: uniqueCode });
        if (!collision) isUnique = true;
      }

      user = await User.create({
        name: `Web3_${walletAddress.slice(2, 8)}`,
        email: `${walletAddress.toLowerCase()}@web3.unicorn.protocol`,
        password: crypto.randomBytes(16).toString('hex'),
        walletAddress: walletAddress.toLowerCase(),
        referralCode: uniqueCode,
        web3Connected: true,
        role: 'user',
        status: 'active',
        lastLoginAt: new Date()
      });

      // Initialize wallets
      await Wallet.create([
        { userId: user._id, type: 'MAIN', balanceINR: 0, balanceUNC: 100, lockedBalance: 0, mainBalance: 0, uncBalance: 100 },
        { userId: user._id, type: 'REFERRAL', balanceINR: 0, balanceUNC: 0, lockedBalance: 0, referralBalance: 0 }
      ]);
    } else {
      user.web3Connected = true;
      user.lastLoginAt = new Date();
      await user.save();
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Web3 wallet authenticated successfully.',
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role,
        referralCode: user.referralCode,
        web3Connected: user.web3Connected
      }
    });
  } catch (error) {
    next(error);
  }
};

// 7. Update Web3 Wallet (Profile connection)
exports.updateWeb3Wallet = async (req, res, next) => {
  try {
    const { address, connected } = req.body;
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        success: true,
        message: connected ? 'BEP-20 wallet connected successfully (Resilient mode).' : 'Wallet disconnected.',
        walletAddress: address || '',
        web3Connected: Boolean(connected)
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ApiError(404, 'User not found.'));
    }

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

// 8. Get Authenticated Profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ApiError(404, 'User not found.'));
    }

    const balances = await getUserBalances(user._id);
    const invStats = await getUserInvestmentStats(user);

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
        twoFactorEnabled: user.twoFactorEnabled,
        mainWalletBalance: balances.mainWalletBalance,
        roiWalletBalance: balances.roiWalletBalance,
        referralWalletBalance: balances.referralWalletBalance,
        activeInvestedAmount: invStats.activeInvestedAmount,
        isReferralActivated: invStats.isReferralActivated,
        todayRoiIncome: invStats.todayRoiIncome,
        directBusiness: invStats.directBusiness,
        teamBusiness: invStats.teamBusiness,
        totalDirects: invStats.totalDirects,
        activePackage: invStats.activePackage,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// 9. Forgot Password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email ? email.toLowerCase() : '' });

    if (user) {
      const resetToken = crypto.randomBytes(20).toString('hex');
      user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins
      await user.save();

      await sendPasswordResetEmail(user.email, resetToken);
    }

    res.json({
      success: true,
      message: 'If an account matches that email, password reset instructions have been sent.'
    });
  } catch (error) {
    next(error);
  }
};

// 10. Reset Password
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
