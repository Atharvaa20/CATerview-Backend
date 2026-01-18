const { InterviewExperience, User } = require('../models');
const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');

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

    const experiences = await InterviewExperience.findAll({
        where,
        order: [['createdAt', 'DESC']],
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['name', 'email']
            }
        ]
    });

    res.json(experiences);
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
    if (background) {
        where.profile = {
            ...where.profile,
            category: background
        };
    }
    if (percentileRange) {
        const minPercentile = parseInt(percentileRange);
        if (!isNaN(minPercentile)) {
            where.profile = {
                ...where.profile,
                catPercentile: { [Op.gte]: minPercentile }
            };
        }
    }

    const experiences = await InterviewExperience.findAll({
        where: {
            isVerified: true,
            ...where
        },
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['name', 'email']
            }
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
    });

    res.json(experiences);
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

    if (!year || !profile || !watSummary || !piQuestions || !finalRemarks || !collegeId) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields'
        });
    }

    const experience = await InterviewExperience.create({
        userId: req.user.id,
        collegeId,
        year,
        profile,
        watSummary,
        piQuestions,
        finalRemarks,
        title,
        isVerified: false
    });

    res.status(201).json({
        success: true,
        message: 'Experience submitted successfully',
        data: experience
    });
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
                model: User,
                as: 'user',
                attributes: ['name', 'email']
            }
        ]
    });

    res.json({
        success: true,
        data: experiences
    });
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
                attributes: ['name', 'email']
            }
        ]
    });

    if (!experience) {
        return res.status(404).json({ error: 'Experience not found' });
    }

    res.json(experience);
});

/**
 * @desc    Toggle helpful/upvote status
 * @route   POST /api/experiences/:id/helpful
 * @access  Private
 */
exports.toggleHelpful = asyncHandler(async (req, res) => {
    const experience = await InterviewExperience.findByPk(req.params.id);
    if (!experience) {
        return res.status(404).json({ error: 'Experience not found' });
    }

    const hasVoted = experience.upvotedBy?.includes(req.user.id);
    if (hasVoted) {
        experience.upvotedBy = experience.upvotedBy.filter(id => id !== req.user.id);
        experience.upvotes--;
    } else {
        experience.upvotedBy = [...(experience.upvotedBy || []), req.user.id];
        experience.upvotes++;
    }

    await experience.save();

    res.json({
        isHelpful: !hasVoted,
        upvotes: experience.upvotes
    });
});
