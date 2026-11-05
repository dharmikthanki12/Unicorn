const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

router.use(protect);

router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);
router.get('/dashboard', userController.getDashboard);
router.get('/referrals', userController.getReferrals);
router.get('/referral-tree', userController.getReferralTree);
router.get('/earnings', userController.getEarnings);

router.post(
  '/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  validate,
  userController.changePassword
);

router.post(
  '/wallet-address',
  userController.updateWalletAddress
);

router.post(
  '/kyc',
  userController.submitKyc
);

module.exports = router;
