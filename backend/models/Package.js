const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Package name is required'],
    trim: true
  },
  tier: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Investment amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  usdValue: {
    type: Number,
    required: true
  },
  dailyRoiRate: {
    type: Number,
    default: 0.0045 // 0.45%
  },
  dailyReturn: {
    type: Number,
    required: true
  },
  monthlyReturn: {
    type: Number,
    required: true
  },
  bonusUnc: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: ''
  },
  tag: {
    type: String,
    default: 'Popular'
  },
  color: {
    type: String,
    default: '#8A70D6'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Package || mongoose.model('Package', packageSchema);

