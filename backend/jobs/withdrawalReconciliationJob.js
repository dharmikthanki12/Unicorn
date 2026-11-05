const Withdrawal = require('../models/Withdrawal');

/**
 * Periodically reconcile withdrawals and check status
 */
async function runWithdrawalReconciliationJob() {
  console.log(`[Withdrawal Reconciliation Job] Running status audit at ${new Date().toISOString()}...`);
  const pendingCount = await Withdrawal.countDocuments({ status: 'pending' });
  const approvedCount = await Withdrawal.countDocuments({ status: 'approved' });
  const paidCount = await Withdrawal.countDocuments({ status: 'paid' });

  console.log(`[Withdrawal Reconciliation Job] Audit: Pending: ${pendingCount}, Approved: ${approvedCount}, Paid: ${paidCount}`);
  return { pendingCount, approvedCount, paidCount };
}

module.exports = {
  runWithdrawalReconciliationJob
};

