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
    enum: ['user', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'pending'],
    default: 'active'
  },
  kycStatus: {
    type: String,
    enum: ['Verified', 'Pending', 'Unverified'],
    default: 'Verified'
  },
  walletAddress: {
    type: String,
    trim: true,
    default: ''
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

// Pre-save password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
