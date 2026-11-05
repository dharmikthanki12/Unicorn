const express = require('express');
const router = express.Router();
const depositController = require('../controllers/depositController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', depositController.submitDeposit);
router.get('/', depositController.getMyDeposits);
router.get('/my', depositController.getMyDeposits);
router.get('/:id', depositController.getDepositById);
router.get('/:id/verify-usdt', depositController.checkUsdtDepositStatus);
router.post('/:id/verify-usdt', depositController.checkUsdtDepositStatus);

module.exports = router;
