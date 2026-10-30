const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/my', rewardController.getMyRewards);

module.exports = router;
