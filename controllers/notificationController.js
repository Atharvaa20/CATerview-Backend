const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getNotifications = asyncHandler(async (req, res) => {
    // Currently returning empty as model doesn't exist yet
    res.json([]);
});
