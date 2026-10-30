const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/balances', walletController.getWalletBalances);
router.post('/transfer', walletController.transferToMainWallet);

module.exports = router;
