const { runRankJob } = require('./rankJob');
const { runAchieverJob } = require('./achieverJob');

/**
 * Volume Tracker Background Job
 * Periodically aggregates personal, direct, and multi-level team business volume
 * Checks volume thresholds and awards one-time Rank Rewards and 4-Month Achiever Trips idempotently
 */
async function runVolumeTrackerJob() {
  console.log(`[Volume Tracker Job] Running volume audits & reward evaluations at ${new Date().toISOString()}...`);
  const rankResult = await runRankJob();
  const achieverResult = await runAchieverJob();
  return { rankResult, achieverResult };
}

module.exports = {
  runVolumeTrackerJob
};

