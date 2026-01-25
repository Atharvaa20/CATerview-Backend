const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const experienceController = require('../controllers/experienceController');

router.get('/', experienceController.getAllExperiences);
router.post('/', experienceController.filterExperiences);
router.post('/submit', auth, experienceController.submitExperience);
router.get('/user/me', auth, experienceController.getMyExperiences);
router.get('/:id(\\d+)', experienceController.getExperienceById);
router.post('/:id(\\d+)/helpful', auth, experienceController.toggleHelpful);

module.exports = router;
