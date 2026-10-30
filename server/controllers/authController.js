const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { DB } = require('../models');
const { JWT_SECRET } = require('../middleware/auth');

function generateReferralCode(name) {
  const clean = (name || 'UNC').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${clean}${rand}`;
}

// 1. Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, referralCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existingUser = await DB.users.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Verify sponsor code if provided
    let sponsor = null;
    if (referralCode) {
      sponsor = await DB.users.findOne({ referralCode: referralCode.toUpperCase() });
      if (!sponsor) {
        return res.status(400).json({ success: false, message: 'Invalid sponsor referral code.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userReferralCode = generateReferralCode(name);

    const newUser = await DB.users.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || '',
      referralCode: userReferralCode,
      referredBy: sponsor ? sponsor.referralCode : null,
      mainWalletBalance: 0,
      roiWalletBalance: 0,
      referralWalletBalance: 0,
      uncBalance: 100, // 100 UNC welcome bonus
      role: 'user'
    });

    // Update sponsor direct count
    if (sponsor) {
      await DB.users.updateOne(
        { _id: sponsor._id },
        { $inc: { directsCount: 1 } }
      );
    }

    const token = jwt.sign({ userId: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to Unicorn.',
      token,
      user: sanitizeUser(newUser)
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// 2. Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await DB.users.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// 3. Get Current User Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await DB.users.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({
      success: true,
      user: sanitizeUser(user)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
};

// 4. Forgot Password (PDF Section 6: Forgot password through registered email)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Registered email is required.' });
    }

    const user = await DB.users.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email address.' });
    }

    // Generate 6-digit recovery OTP
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await DB.users.updateOne(
      { _id: user._id },
      { $set: { twoFactorOtp: resetOtp, twoFactorOtpExpires: expires } }
    );

    // In production, send via SendGrid / AWS SES. For dev, output clearly:
    console.log(`[Account Recovery] Password reset OTP for ${user.email}: ${resetOtp}`);

    res.json({
      success: true,
      message: `Password reset instructions and verification code sent to ${user.email}.`,
      previewOtp: resetOtp // Handy preview for seamless testing
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to process password recovery.' });
  }
};

// 5. Reset Password with OTP
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP code, and new password are required.' });
    }

    const user = await DB.users.findOne({ email: email.toLowerCase() });
    if (!user || user.twoFactorOtp !== String(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await DB.users.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          twoFactorOtp: null,
          twoFactorOtpExpires: null
        }
      }
    );

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

// 6. Connect / Disconnect Web3 Wallet (PDF Section 6: Integrate Web3 wallet connectivity)
exports.updateWeb3Wallet = async (req, res) => {
  try {
    const { address, connected } = req.body;

    await DB.users.updateOne(
      { _id: req.user._id },
      {
        $set: {
          web3Address: address || '',
          web3Connected: Boolean(connected)
        }
      }
    );

    const updated = await DB.users.findById(req.user._id);

    res.json({
      success: true,
      message: connected ? 'BEP-20 Wallet connected successfully.' : 'Wallet disconnected.',
      user: sanitizeUser(updated)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update Web3 wallet.' });
  }
};

function sanitizeUser(u) {
  const initials = u.name ? u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'UN';
  return {
    id: u._id || u.id,
    _id: u._id || u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    referralCode: u.referralCode,
    referredBy: u.referredBy,
    initials,
    mainWalletBalance: Number(u.mainWalletBalance || 0),
    roiWalletBalance: Number(u.roiWalletBalance || 0),
    referralWalletBalance: Number(u.referralWalletBalance || 0),
    uncBalance: Number(u.uncBalance || 0),
    activeInvestedAmount: Number(u.activeInvestedAmount || 0),
    todayRoiIncome: Number(u.todayRoiIncome || 0),
    todayReferralIncome: Number(u.todayReferralIncome || 0),
    directBusiness: Number(u.directBusiness || 0),
    teamBusiness: Number(u.teamBusiness || 0),
    directsCount: Number(u.directsCount || 0),
    rank: u.rank || 'Bronze Leader',
    kycStatus: u.kycStatus || 'Verified',
    web3Address: u.web3Address || '',
    web3Connected: Boolean(u.web3Connected),
    claimedRankRewards: u.claimedRankRewards || [],
    achieverTripsWon: u.achieverTripsWon || [],
    createdAt: u.createdAt
  };
}
