const Deposit = require('../models/Deposit');
const ledgerService = require('../services/ledgerService');
const { verifyTransactionOnChain } = require('../services/blockchainService');

/**
 * Periodically confirm on-chain pending USDT/UNC BEP-20 deposits
 */
async function runDepositConfirmJob() {
  console.log(`[Deposit Confirm Job] Checking pending on-chain deposits at ${new Date().toISOString()}...`);
  const pendingCryptoDeposits = await Deposit.find({
    status: 'pending',
    paymentMethod: { $in: ['USDT (BEP-20)', 'UNC (BEP-20)', 'crypto'] },
    blockchainTxHash: { $ne: '' }
  });

  let confirmedCount = 0;

  for (const dep of pendingCryptoDeposits) {
    try {
      const verification = await verifyTransactionOnChain(dep.blockchainTxHash);
      if (verification && verification.valid) {
        // Automatically approve and credit main wallet
        await ledgerService.credit({
          userId: dep.userId,
          walletType: 'main',
          amount: dep.amount,
          type: 'deposit',
          referenceId: String(dep._id),
          description: `Auto-Confirmed On-Chain Deposit`,
          subtitle: `TxHash: ${dep.blockchainTxHash.slice(0, 16)}...`,
          txHash: dep.blockchainTxHash
        });

        dep.status = 'approved';
        dep.reviewedAt = new Date();
        await dep.save();
        confirmedCount++;
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

