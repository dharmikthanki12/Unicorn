const express = require('express');
const router = express.Router();
const investController = require('../controllers/investController');
const { authenticateUser } = require('../middleware/auth');

router.get('/packages', investController.getPackages);
router.post('/invest', authenticateUser, investController.investPackage);
router.get('/my-investments', authenticateUser, investController.getUserInvestments);

module.exports = router;
