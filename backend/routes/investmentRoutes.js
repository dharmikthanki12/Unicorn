const express = require('express');
const router = express.Router();
const investmentController = require('../controllers/investmentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', investmentController.createInvestment);
router.get('/my', investmentController.getMyInvestments);

module.exports = router;
