const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const depositController = require('../controllers/depositController');
const withdrawalController = require('../controllers/withdrawalController');
const packageController = require('../controllers/packageController');
const investmentController = require('../controllers/investmentController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// All admin routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

// Metrics & Analytics
router.get('/metrics', adminController.getAdminMetrics);
router.get('/audit-logs', adminController.getAuditLogs);

// 1. Users Management
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id', adminController.updateUserStatus);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.post('/users/:id/kyc/approve', adminController.approveKyc);
router.patch('/users/:id/kyc/approve', adminController.approveKyc);
router.post('/users/:id/kyc/reject', adminController.rejectKyc);
router.patch('/users/:id/kyc/reject', adminController.rejectKyc);

// 2. Packages Management
router.get('/packages', adminController.getAllPackages);
router.post('/packages', adminController.createPackage);
router.patch('/packages/:id', adminController.updatePackage);
router.put('/packages/:id', adminController.updatePackage);

// 3. Deposits Review
router.get('/deposits', adminController.getAllDeposits);
router.patch('/deposits/:id', adminController.updateDeposit);
router.post('/deposits/:id/approve', depositController.approveDeposit);
router.patch('/deposits/:id/approve', depositController.approveDeposit);
router.post('/deposits/:id/reject', depositController.rejectDeposit);
router.patch('/deposits/:id/reject', depositController.rejectDeposit);
router.post('/deposits/:id/under-review', depositController.underReviewDeposit);
router.patch('/deposits/:id/under-review', depositController.underReviewDeposit);

// 4. Withdrawals Review
router.get('/withdrawals', adminController.getAllWithdrawals);
router.patch('/withdrawals/:id', adminController.updateWithdrawal);
router.post('/withdrawals/:id/approve', withdrawalController.approveWithdrawal);
router.patch('/withdrawals/:id/approve', withdrawalController.approveWithdrawal);
router.post('/withdrawals/:id/reject', withdrawalController.rejectWithdrawal);
router.patch('/withdrawals/:id/reject', withdrawalController.rejectWithdrawal);
router.post('/withdrawals/:id/mark-paid', withdrawalController.markPaid);
router.patch('/withdrawals/:id/mark-paid', withdrawalController.markPaid);

// 5. Referral Rewards Management
router.get('/referral-rewards', adminController.getAllReferralRewards);
router.patch('/referral-rewards/:id', adminController.updateReferralReward);

// 6. Rank Rewards Management
router.get('/rank-rewards', adminController.getAllRankRewards);
router.patch('/rank-rewards/:id', adminController.updateRankReward);

// 7. Achiever Bonuses Management
router.get('/achiever-bonuses', adminController.getAllAchieverBonuses);
router.patch('/achiever-bonuses/:id', adminController.updateAchieverBonus);

// 8. Reports
router.get('/reports/financial', adminController.getFinancialReport);
router.get('/reports', adminController.getFinancialReport);

// 9. Platform Settings
router.get('/settings', adminController.getPlatformSettings);
router.post('/settings', adminController.updatePlatformSettings);
router.patch('/settings', adminController.updatePlatformSettings);

// 10. Investments
router.get('/investments', investmentController.getAllInvestments);

// 11. Trigger Manual 0.45% Daily ROI Cycle
router.post('/roi/trigger', adminController.triggerDailyRoiCycle);
router.post('/trigger-roi', adminController.triggerDailyRoiCycle);

module.exports = router;
