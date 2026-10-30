const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateUser, requireAdmin } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticateUser);
router.use(requireAdmin);

router.get('/metrics', adminController.getAdminMetrics);
router.get('/users', adminController.getAllUsers);

router.get('/deposits', adminController.getDeposits);
router.post('/deposits/:depositId/approve', adminController.approveDeposit);
router.post('/deposits/:depositId/reject', adminController.rejectDeposit);

router.get('/withdrawals', adminController.getWithdrawals);
router.post('/withdrawals/:withdrawalId/approve', adminController.approveWithdrawal);
router.post('/withdrawals/:withdrawalId/reject', adminController.rejectWithdrawal);

router.post('/roi/trigger', adminController.triggerDailyROI);

module.exports = router;

