const User = require('../models/User');
const AchieverBonus = require('../models/AchieverBonus');
const Reward = require('../models/Reward');
const { ACHIEVER_TRIPS, getUserBusinessVolumes } = require('../services/rewardService');

/**
 * Periodically evaluate Achiever Trips within 4-month qualification window
 */
async function runAchieverJob() {
  console.log(`[Achiever Job] Evaluating Achiever Trips at ${new Date().toISOString()}...`);
  const users = await User.find({ status: 'active' });
  let qualifiedCount = 0;
  const fourMonthsMs = 120 * 24 * 60 * 60 * 1000;

  for (const user of users) {
    try {
      const joinedDate = new Date(user.createdAt || Date.now());
      if ((Date.now() - joinedDate.getTime()) > fourMonthsMs) {
        continue; // Past 4-month window
      }

      const { directVolume } = await getUserBusinessVolumes(user._id, user.referralCode);
      const existingBonuses = await AchieverBonus.find({ userId: user._id });
      const qualifiedTargets = existingBonuses.map(b => b.targetINR);

      for (const trip of ACHIEVER_TRIPS) {
        if (directVolume >= trip.target && !qualifiedTargets.includes(trip.target)) {
          await AchieverBonus.create({
            userId: user._id,
            targetINR: trip.target,
            rewardName: trip.trip,
            directVolumeINR: directVolume,
            status: 'QUALIFIED'
          });

          // Also record in Reward for unified queries
          await Reward.create({
            userId: user._id,
            type: 'achiever_trip',
            rewardName: trip.trip,
            targetVolume: trip.target,
            status: 'unlocked'
          });

          qualifiedCount++;
        }
      }
    } catch (err) {
      console.error(`[Achiever Job] Error for user ${user._id}:`, err.message);
    }
  }

  console.log(`[Achiever Job] Completed. Qualified ${qualifiedCount} new achiever trips.`);
  return { qualifiedCount };
}

module.exports = {
  runAchieverJob
};

