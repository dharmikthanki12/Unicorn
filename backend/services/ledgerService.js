const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');

/**
 * Normalizes wallet type string to standard uppercase enum: MAIN | REFERRAL | ROI
 */
function normalizeType(walletType) {
  const clean = String(walletType || 'MAIN').toUpperCase();
  if (clean.includes('ROI')) return 'ROI';
  if (clean.includes('REF')) return 'REFERRAL';
  if (clean.includes('UNC')) return 'MAIN'; // UNC tokens reside alongside MAIN account
  return 'MAIN';
}

/**
 * Gets or creates the individual ledger account document for a user
 * Strictly enforces 3 Wallets per User: MAIN, REFERRAL, ROI
 */
async function getOrCreateAccount(userId, walletType) {
  const type = normalizeType(walletType);
  let account = await Wallet.findOne({ userId, type });

  if (!account) {
    account = await Wallet.create({
      userId,
      type,
      balance: 0,
      reservedWithdrawal: 0,
      balanceUNC: type === 'MAIN' ? 100 : 0, // 100 welcome UNC tokens on MAIN
      balanceINR: 0,
      mainBalance: 0,
      roiBalance: 0,
      referralBalance: 0,
      uncBalance: type === 'MAIN' ? 100 : 0
    });
  }

  return account;
}

/**
 * Ensures all 3 distinct wallet accounts exist (MAIN, REFERRAL, ROI)
 * and returns a unified state object compatible with existing frontend queries
 */
async function getOrCreateWallet(userId) {
  const [main, roi, referral] = await Promise.all([
    getOrCreateAccount(userId, 'MAIN'),
    getOrCreateAccount(userId, 'ROI'),
    getOrCreateAccount(userId, 'REFERRAL')
  ]);

  return {
    _id: main._id,
    userId,
    main,
    roi,
    referral,
    mainBalance: main.balance,
    roiBalance: roi.balance,
    referralBalance: referral.balance,
    uncBalance: main.balanceUNC || 0,
    reservedWithdrawal: (main.reservedWithdrawal || 0) + (roi.reservedWithdrawal || 0) + (referral.reservedWithdrawal || 0),
    balanceINR: main.balance,
    balanceUNC: main.balanceUNC || 0,
    async save() {
      await Promise.all([main.save(), roi.save(), referral.save()]);
    }
  };
}

/**
 * Credits funds into a user wallet and writes an immutable double-entry ledger record
 */
exports.credit = async ({
  userId,
  walletType,
  amount,
  type,
  referenceId = '',
  description,
  subtitle = '',
  txHash = '',
  idempotencyKey = null
}) => {
  const numAmount = Math.round(Number(amount));
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new ApiError(400, 'Invalid credit amount. Must be positive integer.');
  }

  // Idempotency check
  if (idempotencyKey) {
    const existing = await Transaction.findOne({ idempotencyKey });
    if (existing) {
      return { transaction: existing, duplicate: true };
    }
  }

  const accountType = normalizeType(walletType);
  const account = await getOrCreateAccount(userId, accountType);

  let balanceBefore = account.balance;
  let balanceAfter = balanceBefore + numAmount;

  if (String(walletType).toLowerCase() === 'unc') {
    account.balanceUNC = (account.balanceUNC || 0) + numAmount;
    account.uncBalance = account.balanceUNC;
  } else {
    account.balance = balanceAfter;
    account.balanceINR = balanceAfter;
    if (accountType === 'MAIN') account.mainBalance = balanceAfter;
    if (accountType === 'ROI') account.roiBalance = balanceAfter;
    if (accountType === 'REFERRAL') account.referralBalance = balanceAfter;
  }

  await account.save();

  // Create immutable double-entry transaction record
  const transaction = await Transaction.create({
    walletId: account._id,
    userId,
    walletType: accountType,
    type,
    amount: numAmount,
    amountINR: numAmount,
    amountUNC: String(walletType).toLowerCase() === 'unc' ? numAmount : 0,
    amountFormatted: `+₹${numAmount.toLocaleString('en-IN')}`,
    direction: 'CREDIT',
    entryType: 'credit',
    balanceBefore,
    balanceAfter,
    referenceId,
    description,
    subtitle,
    status: 'completed',
    txHash,
    idempotencyKey: idempotencyKey || undefined
  });

  return { wallet: account, transaction };
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
  txHash = '',
  idempotencyKey = null
}) => {
  const numAmount = Math.round(Number(amount));
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new ApiError(400, 'Invalid debit amount. Must be positive integer.');
  }

  const accountType = normalizeType(walletType);
  const account = await getOrCreateAccount(userId, accountType);

  const available = Math.max(0, account.balance - (account.reservedWithdrawal || 0));
  if (available < numAmount) {
    throw new ApiError(
      400,
      `Insufficient available funds in ${accountType} wallet. Available: ₹${available.toLocaleString('en-IN')}`
    );
  }

  const balanceBefore = account.balance;
  const balanceAfter = balanceBefore - numAmount;

  account.balance = balanceAfter;
  account.balanceINR = balanceAfter;
  if (accountType === 'MAIN') account.mainBalance = balanceAfter;
  if (accountType === 'ROI') account.roiBalance = balanceAfter;
  if (accountType === 'REFERRAL') account.referralBalance = balanceAfter;

  await account.save();

  const transaction = await Transaction.create({
    walletId: account._id,
    userId,
    walletType: accountType,
    type,
    amount: numAmount,
    amountINR: numAmount,
    amountFormatted: `-₹${numAmount.toLocaleString('en-IN')}`,
    direction: 'DEBIT',
    entryType: 'debit',
    balanceBefore,
    balanceAfter,
    referenceId,
    description,
    subtitle,
    status: 'completed',
    txHash,
    idempotencyKey: idempotencyKey || undefined
  });

  return { wallet: account, transaction };
};

/**
 * Reserves withdrawal funds: moves funds from available balance to reservedWithdrawal
 * to strictly prevent double-spending
 */
exports.reserveForWithdrawal = async (userId, walletType, amount) => {
  const numAmount = Math.round(Number(amount));
  const accountType = normalizeType(walletType);
  const account = await getOrCreateAccount(userId, accountType);

  const available = Math.max(0, account.balance - (account.reservedWithdrawal || 0));
  if (available < numAmount) {
    throw new ApiError(
      400,
      `Insufficient available funds in ${accountType} wallet. Available: ₹${available.toLocaleString('en-IN')}`
    );
  }

  account.reservedWithdrawal = (account.reservedWithdrawal || 0) + numAmount;
  account.lockedBalance = account.reservedWithdrawal;
  await account.save();

  return account;
};

/**
 * Releases reserved funds back to available balance if withdrawal is rejected
 */
exports.releaseReservedWithdrawal = async (userId, walletType, amount) => {
  const numAmount = Math.round(Number(amount));
  const accountType = normalizeType(walletType);
  const account = await getOrCreateAccount(userId, accountType);

  account.reservedWithdrawal = Math.max(0, (account.reservedWithdrawal || 0) - numAmount);
  account.lockedBalance = account.reservedWithdrawal;
  await account.save();

  return account;
};

/**
 * Finalizes payout by clearing reserved amount and deducting from balance
 */
exports.finalizeWithdrawal = async (userId, walletType, amount) => {
  const numAmount = Math.round(Number(amount));
  const accountType = normalizeType(walletType);
  const account = await getOrCreateAccount(userId, accountType);

  account.reservedWithdrawal = Math.max(0, (account.reservedWithdrawal || 0) - numAmount);
  account.balance = Math.max(0, account.balance - numAmount);
  account.balanceINR = account.balance;
  account.lockedBalance = account.reservedWithdrawal;
  await account.save();

  return account;
};

exports.getOrCreateWallet = getOrCreateWallet;
exports.getOrCreateAccount = getOrCreateAccount;
