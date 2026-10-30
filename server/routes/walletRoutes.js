const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authenticateUser } = require('../middleware/auth');

router.get('/data', authenticateUser, walletController.getWalletData);
router.post('/deposit', authenticateUser, walletController.submitDeposit);
router.post('/withdraw/request-2fa', authenticateUser, walletController.requestWithdrawal2FA);
router.post('/withdraw', authenticateUser, walletController.submitWithdrawal);
router.post('/transfer', authenticateUser, walletController.transferToMainWallet);

module.exports = router;
