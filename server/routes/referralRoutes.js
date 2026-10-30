const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const { authenticateUser } = require('../middleware/auth');

router.get('/overview', authenticateUser, referralController.getReferralOverview);

module.exports = router;
