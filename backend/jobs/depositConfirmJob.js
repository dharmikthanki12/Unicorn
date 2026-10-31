const Deposit = require('../models/Deposit');
const ledgerService = require('../services/ledgerService');
const { verifyUsdtDepositOnChain, PLATFORM_USDT_DEPOSIT_ADDRESS } = require('../services/blockchainService');

/**
 * Periodically confirm on-chain pending/confirming USDT BEP-20 deposits
 */
async function runDepositConfirmJob() {
  console.log(`[Deposit Confirm Job] Checking pending on-chain deposits at ${new Date().toISOString()}...`);
  
  const pendingCryptoDeposits = await Deposit.find({
    status: { $in: ['confirming', 'detected', 'pending'] },
    paymentMethod: { $in: ['USDT (BEP-20)', 'USDT', 'crypto'] },
    blockchainTxHash: { $exists: true, $ne: '' }
  });

  let confirmedCount = 0;

  for (const dep of pendingCryptoDeposits) {
    try {
      const verification = await verifyUsdtDepositOnChain(
        dep.blockchainTxHash,
        dep.destinationAddress || PLATFORM_USDT_DEPOSIT_ADDRESS
      );

      dep.confirmations = verification.confirmations || dep.confirmations;
      dep.blockNumber = verification.blockNumber || dep.blockNumber;
      dep.verificationDetails = verification;

      if (verification.status === 'approved' && dep.status !== 'approved') {
        // Automatically approve and credit main wallet exactly once
        await ledgerService.credit({
          userId: dep.userId,
          walletType: 'main',
          amount: dep.amount,
          type: 'deposit',
          referenceId: String(dep._id),
          description: 'Auto-Confirmed On-Chain USDT Deposit',
          subtitle: `TxHash: ${dep.blockchainTxHash.slice(0, 16)}... · BSC Verified`,
          txHash: dep.blockchainTxHash
        });

        dep.status = 'approved';
        dep.autoVerified = true;
        dep.reviewedAt = new Date();
        await dep.save();
        confirmedCount++;
      } else if (verification.status === 'failed' || verification.status === 'rejected') {
        dep.status = verification.status;
        dep.failureReason = verification.reason || '';
        await dep.save();
      } else {
        dep.status = verification.status;
        await dep.save();
      }
    } catch (err) {
      console.warn(`[Deposit Confirm Job] Verification pending for tx ${dep.blockchainTxHash}:`, err.message);
    }
  }

  console.log(`[Deposit Confirm Job] Completed. Auto-confirmed ${confirmedCount} deposits.`);
  return { confirmedCount };
}

module.exports = {
  runDepositConfirmJob
};
