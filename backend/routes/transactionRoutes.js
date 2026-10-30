const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/my', transactionController.getMyTransactions);
router.get('/:id', transactionController.getTransactionById);

module.exports = router;
