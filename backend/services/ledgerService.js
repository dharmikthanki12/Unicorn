const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');

/**
 * Gets or creates the official Wallet record for a user
 */
async function getOrCreateWallet(userId) {
  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = await Wallet.create({
      userId,
      mainBalance: 0,
      roiBalance: 0,
      referralBalance: 0,
      uncBalance: 0,
      reservedWithdrawal: 0
    });
  }
  return wallet;
}

/**
 * Maps logical wallet types to document field names
 */
function getFieldForWallet(walletType) {
  switch (walletType) {
    case 'main':
      return 'mainBalance';
    case 'roi':
      return 'roiBalance';
    case 'referral':
      return 'referralBalance';
    case 'unc':
      return 'uncBalance';
    default:
      throw new ApiError(400, `Invalid wallet type: ${walletType}`);
  }
}

/**
 * Credits funds into a user wallet and writes immutable ledger entry
 */
exports.credit = async ({
  userId,
  walletType,
  amount,
  type,
  referenceId = '',
  description,
  subtitle = '',
  txHash = ''
}) => {
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new ApiError(400, 'Invalid credit amount. Must be positive.');
  }

  const wallet = await getOrCreateWallet(userId);
  const field = getFieldForWallet(walletType);
  const balanceBefore = Number(wallet[field] || 0);
  const balanceAfter = balanceBefore + numAmount;

  // Atomically update balance
  wallet[field] = balanceAfter;
  await wallet.save();

  // Write immutable transaction ledger entry
  const transaction = await Transaction.create({
    userId,
    walletType,
    type,
    amount: numAmount,
    amountFormatted: `+₹${numAmount.toLocaleString('en-IN')}`,
    entryType: 'credit',
    balanceBefore,
    balanceAfter,
    referenceId,
    description,
    subtitle,
    status: 'completed',
    txHash
  });

  return { wallet, transaction };
};

/**
 * Debits funds from a user wallet with strict overdraft prevention
 */
exports.debit = async ({
  userId,
  walletType,
  amount,
  type,
  referenceId = '',
  description,
  subtitle = '',
  txHash = ''
}) => {
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new ApiError(400, 'Invalid debit amount. Must be positive.');
  }

  const wallet = await getOrCreateWallet(userId);
  const field = getFieldForWallet(walletType);
  const balanceBefore = Number(wallet[field] || 0);

  if (balanceBefore < numAmount) {
    throw new ApiError(400, `Insufficient funds in ${walletType.toUpperCase()} wallet. Available: ₹${balanceBefore.toLocaleString('en-IN')}`);
  }

  const balanceAfter = balanceBefore - numAmount;
  wallet[field] = balanceAfter;
  await wallet.save();

  const transaction = await Transaction.create({
    userId,
    walletType,
    type,
    amount: numAmount,
    amountFormatted: `-₹${numAmount.toLocaleString('en-IN')}`,
    entryType: 'debit',
    balanceBefore,
    balanceAfter,
    referenceId,
    description,
    subtitle,
    status: 'completed',
    txHash
  });

  return { wallet, transaction };
};

/**
 * Reserves withdrawal funds to prevent double spending
 */
exports.reserveForWithdrawal = async (userId, walletType, amount) => {
  const numAmount = Number(amount);
  const wallet = await getOrCreateWallet(userId);
  const field = getFieldForWallet(walletType);

  if (wallet[field] < numAmount) {
    throw new ApiError(400, `Insufficient withdrawable balance in ${walletType.toUpperCase()} wallet.`);
  }

  wallet[field] -= numAmount;
  wallet.reservedWithdrawal += numAmount;
  await wallet.save();

  return wallet;
};

/**
 * Releases reserved funds back to user wallet if withdrawal is rejected
 */
exports.releaseReservedWithdrawal = async (userId, walletType, amount) => {
  const numAmount = Number(amount);
  const wallet = await getOrCreateWallet(userId);
  const field = getFieldForWallet(walletType);

  wallet.reservedWithdrawal = Math.max(0, wallet.reservedWithdrawal - numAmount);
  wallet[field] += numAmount;
  await wallet.save();

  return wallet;
};

/**
 * Finalizes payout by clearing reserved amount
 */
exports.finalizeWithdrawal = async (userId, walletType, amount) => {
  const numAmount = Number(amount);
  const wallet = await getOrCreateWallet(userId);

  wallet.reservedWithdrawal = Math.max(0, wallet.reservedWithdrawal - numAmount);
  await wallet.save();

  return wallet;
};

exports.getOrCreateWallet = getOrCreateWallet;
