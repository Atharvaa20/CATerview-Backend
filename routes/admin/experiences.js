const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/adminController');

router.get('/all', adminController.getAllAdminExperiences);
router.get('/pending', adminController.getPendingExperiences);
router.get('/verified', adminController.getVerifiedExperiences);

router.get('/:id', adminController.getAdminExperienceById);
router.put('/:id/verify', adminController.verifyExperience);
router.put('/:id/reject', adminController.rejectExperience);
router.delete('/:id', adminController.rejectExperience);

module.exports = router;
