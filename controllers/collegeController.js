const { College, InterviewExperience, User, sequelize } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get all colleges
 * @route   GET /api/colleges
 * @access  Public
 */
exports.getAllColleges = asyncHandler(async (req, res) => {
    const colleges = await College.findAll({
        attributes: [
            'id',
            'name',
            'slug',
            [
                sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM interview_experiences AS ie
                    WHERE
                        ie.college_id = "College".id
                        AND ie.is_verified = true
                )`),
                'experienceCount'
            ]
        ],
        order: [['name', 'ASC']]
    });

    return ApiResponse.success(res, colleges, 'Colleges fetched successfully');
});


/**
 * @desc    Get college experiences
 * @route   GET /api/colleges/:id/experiences
 * @access  Public
 */
exports.getCollegeExperiences = asyncHandler(async (req, res) => {
    const collegeId = req.params.id;

    // Check if college exists
    const collegeExists = await College.findByPk(collegeId);
    if (!collegeExists) {
        throw new ApiError(404, 'College not found');
    }

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

    return ApiResponse.success(res, experiences, 'College experiences fetched successfully');
});

/**
 * @desc    Get college statistics
 * @route   GET /api/colleges/:id/stats
 * @access  Public
 */
exports.getCollegeStats = asyncHandler(async (req, res) => {
    const collegeId = req.params.id;

    const collegeExists = await College.findByPk(collegeId);
    if (!collegeExists) {
        throw new ApiError(404, 'College not found');
    }

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

    const data = {
        total: parseInt(stats[0]?.get('total') || 0),
        avgCatPercentile: parseFloat(stats[0]?.get('avgCatPercentile') || 0).toFixed(2),
        avgWorkExp: parseFloat(stats[0]?.get('avgWorkExp') || 0).toFixed(2),
        avgQuestions: parseFloat(stats[0]?.get('avgQuestions') || 0).toFixed(1)
    };

    return ApiResponse.success(res, data, 'Statistics fetched successfully');
});
