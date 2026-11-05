require('dotenv').config();
const { connectDB } = require('../config/database');
const mongoose = require('mongoose');

async function fix() {
  await connectDB();
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Investment = mongoose.model('Investment', new mongoose.Schema({}, { strict: false }));

  const investments = await Investment.find({ status: { $in: ['confirmed', 'active', 'ACTIVE', 'CONFIRMED'] } });
  console.log('Total confirmed investments found:', investments.length);

  for (const inv of investments) {
    const updated = await User.findByIdAndUpdate(inv.userId, {
      $set: {
        isReferralActivated: true,
        activeInvestedAmount: inv.amount || 10000,
        rank: 'Starter Unicorn'
      }
    }, { new: true });
    console.log('Successfully activated user:', updated?.email, {
      referralCode: updated?.referralCode,
      isReferralActivated: updated?.isReferralActivated,
      activeInvestedAmount: updated?.activeInvestedAmount
    });
  }

  process.exit(0);
}

fix().catch(err => {
  console.error('Error fixing users:', err);
  process.exit(1);
});

