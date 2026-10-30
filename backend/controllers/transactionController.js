const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');

// 1. Get Transactions History
exports.getMyTransactions = async (req, res, next) => {
  try {
    const { type, walletType, limit = 50, page = 1 } = req.query;
    const query = { userId: req.user._id };

    if (type) query.type = type;
    if (walletType) query.walletType = walletType;

    const skip = (Number(page) - 1) * Number(limit);
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      count: transactions.length,
      total,
      transactions
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Transaction by ID
exports.getTransactionById = async (req, res, next) => {
  try {
    const tx = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!tx) {
      return next(new ApiError(404, 'Transaction record not found.'));
    }
    res.json({
      success: true,
      transaction: tx
    });
  } catch (error) {
    next(error);
  }
};
