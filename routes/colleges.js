const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController');

router.get('/', collegeController.getAllColleges);
router.get('/:id(\\d+)/stats', collegeController.getCollegeStats);
router.get('/:id(\\d+)/experiences', collegeController.getCollegeExperiences);

module.exports = router;
