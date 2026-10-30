const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/request-otp', withdrawalController.requestWithdrawalOtp);
router.post('/verify-otp', withdrawalController.verifyWithdrawalOtp);
router.post('/', withdrawalController.submitWithdrawal);
router.get('/my', withdrawalController.getMyWithdrawals);

module.exports = router;

