const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/adminController');

router.get('/', adminController.getAllAdminColleges);
router.post('/', adminController.createCollege);
router.put('/:id', adminController.updateCollege);

module.exports = router;
