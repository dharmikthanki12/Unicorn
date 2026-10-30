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

// Users Management
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);

// Deposits Review
router.get('/deposits', depositController.getAllDeposits);
router.patch('/deposits/:id/approve', depositController.approveDeposit);
router.patch('/deposits/:id/reject', depositController.rejectDeposit);

// Withdrawals Review
router.get('/withdrawals', withdrawalController.getAllWithdrawals);
router.patch('/withdrawals/:id/approve', withdrawalController.approveWithdrawal);
router.patch('/withdrawals/:id/reject', withdrawalController.rejectWithdrawal);
router.patch('/withdrawals/:id/mark-paid', withdrawalController.markPaid);

// Investment Records Review
router.get('/investments', investmentController.getAllInvestments);

// Packages Management
router.post('/packages', packageController.createPackage);
router.put('/packages/:id', packageController.updatePackage);
router.patch('/packages/:id/status', packageController.toggleStatus);

// Trigger Manual 0.45% Daily ROI Cycle
router.post('/roi/trigger', adminController.triggerDailyRoiCycle);

module.exports = router;
