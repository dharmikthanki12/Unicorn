const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your full name'],
    trim: true,
    maxlength: 60
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false // Never return password in queries by default
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  referralCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  referredBy: {
    type: String,
    uppercase: true,
    trim: true,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'super_admin', 'USER', 'ADMIN', 'SUPER_ADMIN'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'pending', 'ACTIVE', 'SUSPENDED', 'PENDING'],
    default: 'active'
  },
  kycStatus: {
    type: String,
    enum: ['Verified', 'Pending', 'Unverified', 'VERIFIED', 'PENDING', 'UNVERIFIED'],
    default: 'Verified'
  },
  sponsorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  walletAddress: {
    type: String,
    trim: true,
    default: ''
  },
  walletNonce: {
    type: String,
    default: () => Math.floor(100000 + Math.random() * 900000).toString()
  },
  nonce: {
    type: String,
    default: function() { return this.walletNonce; }
  },
  passwordHash: {
    type: String,
    default: function() { return this.password; }
  },
  twoFactorSecret: {
    type: String,
    default: null
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  refreshToken: {
    type: String,
    default: null
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  web3Connected: {
    type: Boolean,
    default: false
  },
  rank: {
    type: String,
    default: 'Bronze Leader'
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  twoFactorOtp: {
    type: String,
    default: null
  },
  twoFactorOtpExpires: {
    type: Date,
    default: null
  },
  twoFactorVerifiedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Pre-save password hashing (Mongoose 8/9 async hook without next callback)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);

