const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/overview', referralController.getReferralOverview);

module.exports = router;
