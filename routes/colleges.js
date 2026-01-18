const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController');

router.get('/', collegeController.getAllColleges);
router.get('/:id/stats', collegeController.getCollegeStats);
router.get('/:id/experiences', collegeController.getCollegeExperiences);

module.exports = router;
