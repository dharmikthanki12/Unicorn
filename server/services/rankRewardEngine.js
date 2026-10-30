const { DB } = require('../models');
const { RANK_REWARDS, ACHIEVER_TRIPS } = require('../config/constants');

/**
 * Checks and awards:
 * 1. Rank Reward Bonus (One-time, on business target including personal)
 * 2. Achiever Trip Rewards (Direct business within 4 months)
 */
async function checkRankAndAchieverRewards(userId) {
  const user = await DB.users.findById(userId);
  if (!user) return;

  const totalBusiness = (Number(user.activeInvestedAmount) || 0) + (Number(user.teamBusiness) || 0);
  const directBusiness = Number(user.directBusiness) || 0;
  const claimedRanks = user.claimedRankRewards || [];
  const wonTrips = user.achieverTripsWon || [];

  let highestRankName = user.rank;

  // 1. Check Rank Rewards (One-Time)
  for (const r of RANK_REWARDS) {
    if (totalBusiness >= r.target) {
      highestRankName = r.rankName;

      // Has this rank tier bonus already been claimed?
      const rankKey = `rank_${r.target}`;
      if (!claimedRanks.includes(rankKey)) {
        const bonusAmount = r.bonus || (r.bonusRate ? Math.round(r.target * r.bonusRate) : r.fixedBonus);

        // Credit to referral wallet / rewards
        await DB.users.updateOne(
          { _id: user._id },
          {
            $inc: { referralWalletBalance: bonusAmount },
            $push: { claimedRankRewards: rankKey },
            $set: { rank: highestRankName }
          }
        );

        await DB.transactions.create({
          userId: user._id,
          type: 'bonus',
          amount: bonusAmount,
          amountFormatted: `+₹${bonusAmount.toLocaleString('en-IN')}`,
          title: `Rank Reward · ${r.rankName}`,
          subtitle: `Achieved ₹${r.target.toLocaleString('en-IN')} cumulative volume`,
          status: 'completed'
        });

        console.log(`[Rank Engine] Awarded ${r.rankName} (₹${bonusAmount}) to ${user.name}`);
      }
    }
  }

  // 2. Check Achiever Bonus Trips (within 4 months)
  // Check if user is within 4 months of joined date
  const joinedDate = new Date(user.createdAt || Date.now());
  const fourMonthsMs = 120 * 24 * 60 * 60 * 1000;
  const isWithinFourMonths = (Date.now() - joinedDate.getTime()) <= fourMonthsMs;

  if (isWithinFourMonths) {
    for (const trip of ACHIEVER_TRIPS) {
      if (directBusiness >= trip.target && !wonTrips.includes(trip.reward)) {
        await DB.users.updateOne(
          { _id: user._id },
          { $push: { achieverTripsWon: trip.reward } }
        );

        await DB.transactions.create({
          userId: user._id,
          type: 'bonus',
          amount: 0,
          amountFormatted: `QUALIFIED`,
          title: `Achiever Trip Award · ${trip.reward}`,
          subtitle: `Achieved ₹${trip.target.toLocaleString('en-IN')} direct business within 4 months`,
          status: 'completed'
        });

        console.log(`[Achiever Engine] Awarded ${trip.reward} to ${user.name}`);
      }
    }
  }
}

/**
 * Propagate new investment volume upwards through team business trees
 */
async function propagateTeamBusiness(userId, investmentAmount) {
  let user = await DB.users.findById(userId);
  if (!user || !user.referredBy) return;

  // Direct sponsor gets directBusiness credit + 1 direct count if first package
  const directSponsor = await DB.users.findOne({ referralCode: user.referredBy });
  if (directSponsor) {
    await DB.users.updateOne(
      { _id: directSponsor._id },
      { $inc: { directBusiness: investmentAmount } }
    );
    await checkRankAndAchieverRewards(directSponsor._id);
  }

  // Entire upline tree gets teamBusiness credit
  let currentSponsorCode = user.referredBy;
  let level = 1;

  while (currentSponsorCode && level <= 30) {
    const upline = await DB.users.findOne({ referralCode: currentSponsorCode });
    if (!upline) break;

    await DB.users.updateOne(
      { _id: upline._id },
      { $inc: { teamBusiness: investmentAmount } }
    );

    await checkRankAndAchieverRewards(upline._id);

    currentSponsorCode = upline.referredBy;
    level++;
  }
}

module.exports = {
  checkRankAndAchieverRewards,
  propagateTeamBusiness
};

