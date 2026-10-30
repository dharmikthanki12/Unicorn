const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');

router.get('/', packageController.getPackages);
router.get('/:id', packageController.getPackageById);

module.exports = router;

