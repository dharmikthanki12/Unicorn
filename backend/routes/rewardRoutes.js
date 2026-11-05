const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/my', rewardController.getMyRewards);
router.get('/rank', rewardController.getRankRewards);
router.get('/achiever', rewardController.getAchieverRewards);
router.get('/referral-income', rewardController.getReferralIncome);
router.get('/', rewardController.getMyRewards);

module.exports = router;
