const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/adminController');

router.get('/', adminController.getAllAdminColleges);
router.post('/', adminController.createCollege);
router.put('/:id(\\d+)', adminController.updateCollege);
router.delete('/:id(\\d+)', adminController.deleteCollege);

module.exports = router;

