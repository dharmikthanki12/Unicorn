const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/request-otp', withdrawalController.requestWithdrawalOtp);
router.post('/request-2fa', withdrawalController.requestWithdrawalOtp);
router.post('/verify-otp', withdrawalController.verifyWithdrawalOtp);
router.post('/verify-2fa', withdrawalController.verifyWithdrawalOtp);
router.post('/request', withdrawalController.submitWithdrawal);
router.post('/', withdrawalController.submitWithdrawal);
router.get('/', withdrawalController.getMyWithdrawals);
router.get('/my', withdrawalController.getMyWithdrawals);
router.get('/:id', withdrawalController.getWithdrawalById);

module.exports = router;
