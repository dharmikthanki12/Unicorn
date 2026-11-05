const { runDailyRoiJob } = require('./roiJob');
const { runRankJob } = require('./rankJob');
const { runAchieverJob } = require('./achieverJob');
const { runVolumeTrackerJob } = require('./volumeTrackerJob');
const { runDepositConfirmJob } = require('./depositConfirmJob');
const { runMaturityJob } = require('./maturityJob');
const { runWithdrawalReconciliationJob } = require('./withdrawalReconciliationJob');

function startBackgroundJobs() {
  console.log('[Background Jobs] Initializing automated schedules...');

  // 1. Run ROI job every 24 hours (or at 00:00 UTC)
  setInterval(async () => {
    try {
      await runDailyRoiJob();
    } catch (e) {
      console.error('[Jobs Error] Daily ROI Job:', e.message);
    }
  }, 60 * 60 * 1000);

  // 2. Deposit confirmation checker every 2 minutes
  setInterval(async () => {
    try {
      await runDepositConfirmJob();
    } catch (e) {
      console.error('[Jobs Error] Deposit Confirm Job:', e.message);
    }
  }, 2 * 60 * 1000);

  // 3. Volume Tracker & Rank/Achiever evaluator every 15 minutes
  setInterval(async () => {
    try {
      await runVolumeTrackerJob();
    } catch (e) {
      console.error('[Jobs Error] Volume Tracker Job:', e.message);
    }
  }, 15 * 60 * 1000);

  // 4. Staking maturity check once per day
  setInterval(async () => {
    try {
      await runMaturityJob();
    } catch (e) {
      console.error('[Jobs Error] Maturity Job:', e.message);
    }
  }, 24 * 60 * 60 * 1000);
}

module.exports = {
  runDailyRoiJob,
  runDepositConfirmJob,
  runVolumeTrackerJob,
  runRankJob,
  runAchieverJob,
  runMaturityJob,
  runWithdrawalReconciliationJob,
  startBackgroundJobs
};
