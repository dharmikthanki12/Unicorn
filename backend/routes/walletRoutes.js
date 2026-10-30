const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Standard endpoints
router.get('/', walletController.getWallets);
router.get('/balances', walletController.getWalletBalances);
router.get('/data', walletController.getWalletBalances); // Used by frontend walletAPI.getData()
router.get('/summary', walletController.getWalletsSummary);
router.get('/:type/transactions', walletController.getWalletTransactions);
router.post('/transfer', walletController.transferToMainWallet);

// Delegated frontend endpoints (for frontend walletAPI compatibility)
router.post('/deposit', walletController.submitDeposit);
router.post('/withdraw/request-2fa', walletController.request2FA);
router.post('/withdraw', walletController.submitWithdrawal);

module.exports = router;
