const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/adminController');

router.get('/', adminController.getAllAdminUsers);
router.get('/:id(\\d+)', adminController.getAdminUserById);

module.exports = router;
