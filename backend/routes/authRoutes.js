const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');
const { protect } = require('../middleware/authMiddleware');

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validate,
  authController.login
);

router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
  validate,
  authController.refreshToken
);

router.post('/logout', authController.logout);

router.post(
  '/wallet/nonce',
  [body('walletAddress').notEmpty().withMessage('Wallet address is required')],
  validate,
  authController.getWalletNonce
);

router.post(
  '/wallet/verify',
  [
    body('walletAddress').notEmpty().withMessage('Wallet address is required'),
    body('signature').notEmpty().withMessage('Cryptographic signature is required')
  ],
  validate,
  authController.verifyWalletSignature
);

router.post('/web3-wallet', protect, authController.updateWeb3Wallet);

router.get('/profile', protect, authController.getProfile);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid registered email is required')],
  validate,
  authController.forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  validate,
  authController.resetPassword
);

module.exports = router;
