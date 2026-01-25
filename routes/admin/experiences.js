const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/adminController');

router.get('/all', adminController.getAllAdminExperiences);
router.get('/pending', adminController.getPendingExperiences);
router.get('/verified', adminController.getVerifiedExperiences);

router.get('/:id(\\d+)', adminController.getAdminExperienceById);
router.put('/:id(\\d+)/verify', adminController.verifyExperience);
router.put('/:id(\\d+)/reject', adminController.rejectExperience);
router.delete('/:id(\\d+)', adminController.rejectExperience);

module.exports = router;
