const { User, sequelize, models } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get current user profile
 * @route   GET /api/users/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'name', 'email', 'role', 'createdAt'],
        include: [
            {
                model: models.InterviewExperience,
                as: 'authoredExperiences',
                attributes: ['id', 'title', 'year', 'isVerified', 'createdAt'],
                include: [
                    {
                        model: models.College,
                        as: 'college',
                        attributes: ['id', 'name', 'slug']
                    }
                ]
            }
        ],
        order: [[{ model: models.InterviewExperience, as: 'authoredExperiences' }, 'createdAt', 'DESC']]
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    return ApiResponse.success(res, user, 'Profile fetched successfully');
});

/**
 * @desc    Get user by ID (Admin only)
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
exports.getUserById = asyncHandler(async (req, res) => {
    // Note: Admin check is handled by middleware
    const user = await User.findByPk(req.params.id, {
        attributes: ['id', 'name', 'email', 'role', 'createdAt'],
        include: [
            {
                model: models.InterviewExperience,
                as: 'authoredExperiences',
                attributes: ['id', 'title', 'year', 'isVerified', 'createdAt'],
                include: [
                    {
                        model: models.College,
                        as: 'college',
                        attributes: ['id', 'name', 'slug']
                    }
                ]
            }
        ],
        order: [[{ model: models.InterviewExperience, as: 'authoredExperiences' }, 'createdAt', 'DESC']]
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    return ApiResponse.success(res, user, 'User details fetched successfully');
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/me
 * @access  Private
 */
exports.updateMe = asyncHandler(async (req, res) => {
    const { name, email } = req.body;

    if (!name || !email) {
        throw new ApiError(400, 'Name and email are required');
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({
        where: {
            email,
            id: { [sequelize.Op.ne]: req.user.id }
        }
    });

    if (existingUser) {
        throw new ApiError(400, 'Email is already in use by another account');
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
        throw new ApiError(404, 'User profile not found');
    }

    user.name = name;
    user.email = email;
    await user.save();

    const updatedUser = await User.findByPk(user.id, {
        attributes: ['id', 'name', 'email', 'role', 'createdAt']
    });

    return ApiResponse.success(res, updatedUser, 'Profile updated successfully');
});
