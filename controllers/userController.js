const { User, sequelize, models } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get current user profile
 * @route   GET /api/users/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'name', 'email', 'role'],
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
                ],
                order: [['createdAt', 'DESC']]
            }
        ]
    });

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
});

/**
 * @desc    Get user by ID (Admin only)
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
exports.getUserById = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to access this resource' });
    }

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
                ],
                order: [['createdAt', 'DESC']]
            }
        ]
    });

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/me
 * @access  Private
 */
exports.updateMe = asyncHandler(async (req, res) => {
    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({
        where: {
            email,
            id: { [sequelize.Op.ne]: req.user.id }
        }
    });

    if (existingUser) {
        return res.status(400).json({ error: 'Email is already in use' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    user.name = name;
    user.email = email;
    await user.save();

    const updatedUser = await User.findByPk(user.id, {
        attributes: ['id', 'name', 'email', 'role', 'createdAt']
    });

    res.json(updatedUser);
});
