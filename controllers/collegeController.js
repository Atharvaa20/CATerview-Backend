const { College, InterviewExperience, User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { sequelize } = require('../models');

/**
 * @desc    Get all colleges
 * @route   GET /api/colleges
 * @access  Public
 */
exports.getAllColleges = asyncHandler(async (req, res) => {
    const colleges = await College.findAll({
        order: [['name', 'ASC']],
        attributes: ['id', 'name', 'slug']
    });
    res.json(colleges);
});

/**
 * @desc    Get college experiences
 * @route   GET /api/colleges/:id/experiences
 * @access  Public
 */
exports.getCollegeExperiences = asyncHandler(async (req, res) => {
    const collegeId = req.params.id;

    const experiences = await InterviewExperience.findAll({
        where: { collegeId },
        include: [
            {
                model: College,
                as: 'college',
                attributes: ['id', 'name']
            },
            {
                model: User,
                as: 'user',
                attributes: ['name']
            }
        ],
        order: [['createdAt', 'DESC']]
    });

    res.json(experiences);
});

/**
 * @desc    Get college statistics
 * @route   GET /api/colleges/:id/stats
 * @access  Public
 */
exports.getCollegeStats = asyncHandler(async (req, res) => {
    const collegeId = req.params.id;

    const stats = await InterviewExperience.findAll({
        where: {
            isVerified: true,
            collegeId: collegeId
        },
        attributes: [
            [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
            [
                sequelize.literal(`AVG((profile->>'catPercentile')::float)`),
                'avgCatPercentile'
            ],
            [
                sequelize.literal(`AVG((profile->>'workExperience')::float)`),
                'avgWorkExp'
            ],
            [
                sequelize.literal(`AVG(jsonb_array_length(pi_questions))`),
                'avgQuestions'
            ]
        ]
    });

    res.json({
        message: 'Statistics fetched successfully',
        data: {
            total: stats[0]?.get('total') || 0,
            avgCatPercentile: stats[0]?.get('avgCatPercentile') || 0,
            avgWorkExp: stats[0]?.get('avgWorkExp') || 0,
            avgQuestions: stats[0]?.get('avgQuestions') || 0
        }
    });
});
