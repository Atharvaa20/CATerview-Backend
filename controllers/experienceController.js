const { InterviewExperience, User, College } = require('../models');
const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get all experiences with optional filters
 * @route   GET /api/experiences
 * @access  Public
 */
exports.getAllExperiences = asyncHandler(async (req, res) => {
    const { userId } = req.query;
    const where = {};

    if (userId) {
        where.userId = userId;
    }

    const { count, rows } = await InterviewExperience.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['name', 'email']
            },
            {
                model: College,
                as: 'college',
                attributes: ['name']
            }
        ]
    });

    return ApiResponse.success(res, { count, experiences: rows }, 'Experiences fetched successfully');
});

/**
 * @desc    Filter experiences with complex queries
 * @route   POST /api/experiences
 * @access  Public
 */
exports.filterExperiences = asyncHandler(async (req, res) => {
    const {
        college,
        year,
        percentileRange,
        background,
        limit = 10,
        offset = 0
    } = req.body;

    const where = {};

    if (college) where.collegeId = college;
    if (year) where.year = year;

    // Background filter (usually stored in profile.category)
    if (background) {
        where.profile = {
            ...(where.profile || {}),
            category: background
        };
    }

    if (percentileRange) {
        const minPercentile = parseInt(percentileRange);
        if (!isNaN(minPercentile)) {
            where.profile = {
                ...(where.profile || {}),
                catPercentile: { [Op.gte]: minPercentile }
            };
        }
    }

    const { count, rows } = await InterviewExperience.findAndCountAll({
        where: {
            isVerified: true,
            ...where
        },
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['name']
            },
            {
                model: College,
                as: 'college',
                attributes: ['name']
            }
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
    });

    return ApiResponse.success(res, { count, experiences: rows }, 'Filtered experiences fetched successfully');
});

/**
 * @desc    Submit new experience
 * @route   POST /api/experiences/submit
 * @access  Private
 */
exports.submitExperience = asyncHandler(async (req, res) => {
    const {
        year,
        profile,
        watSummary,
        piQuestions,
        finalRemarks,
        collegeId,
        title
    } = req.body;

    if (!year || !profile || !collegeId) {
        throw new ApiError(400, 'Missing required fields: year, profile, and college are required');
    }

    const experience = await InterviewExperience.create({
        userId: req.user.id,
        collegeId,
        year,
        profile,
        watSummary,
        piQuestions,
        finalRemarks,
        title: title || `Interview Experience ${year}`,
        isVerified: false
    });

    return ApiResponse.success(res, experience, 'Experience submitted successfully! It will be reviewed by our team.', 201);
});

/**
 * @desc    Get experiences for current user
 * @route   GET /api/experiences/user/me
 * @access  Private
 */
exports.getMyExperiences = asyncHandler(async (req, res) => {
    const experiences = await InterviewExperience.findAll({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']],
        include: [
            {
                model: College,
                as: 'college',
                attributes: ['name']
            }
        ]
    });

    return ApiResponse.success(res, experiences, 'My experiences fetched successfully');
});

/**
 * @desc    Get single experience by ID
 * @route   GET /api/experiences/:id
 * @access  Public
 */
exports.getExperienceById = asyncHandler(async (req, res) => {
    const experience = await InterviewExperience.findByPk(req.params.id, {
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['name']
            },
            {
                model: College,
                as: 'college',
                attributes: ['id', 'name']
            }
        ]
    });

    if (!experience) {
        throw new ApiError(404, 'Experience not found');
    }

    // Optional: Increment view count
    experience.views = (experience.views || 0) + 1;
    await experience.save();

    return ApiResponse.success(res, experience, 'Experience details fetched successfully');
});

/**
 * @desc    Toggle helpful/upvote status
 * @route   POST /api/experiences/:id/helpful
 * @access  Private
 */
exports.toggleHelpful = asyncHandler(async (req, res) => {
    const experience = await InterviewExperience.findByPk(req.params.id);
    if (!experience) {
        throw new ApiError(404, 'Experience not found');
    }

    const userId = req.user.id;
    let upvotedByList = Array.isArray(experience.upvotedBy) ? experience.upvotedBy : [];
    const hasVoted = upvotedByList.includes(userId);

    if (hasVoted) {
        upvotedByList = upvotedByList.filter(id => id !== userId);
        experience.upvotes = Math.max(0, (experience.upvotes || 0) - 1);
    } else {
        upvotedByList = [...upvotedByList, userId];
        experience.upvotes = (experience.upvotes || 0) + 1;
    }

    experience.upvotedBy = upvotedByList;
    await experience.save();

    return ApiResponse.success(res, {
        isHelpful: !hasVoted,
        upvotes: experience.upvotes
    }, hasVoted ? 'Upvote removed' : 'Marked as helpful');
});
