const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/adminController');

router.get('/', adminController.getAdminStats);

module.exports = router;
