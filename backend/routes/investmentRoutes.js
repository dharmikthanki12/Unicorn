const express = require('express');
const router = express.Router();
const investmentController = require('../controllers/investmentController');
const packageController = require('../controllers/packageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/packages', packageController.getPackages);
router.post('/invest', investmentController.createInvestment);
router.get('/my-investments', investmentController.getMyInvestments);

router.post('/', investmentController.createInvestment);
router.get('/', investmentController.getMyInvestments);
router.get('/my', investmentController.getMyInvestments);
router.get('/:id', investmentController.getInvestmentById);

module.exports = router;
