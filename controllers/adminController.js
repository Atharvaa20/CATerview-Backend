const { InterviewExperience, College, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get administrative dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
exports.getAdminStats = asyncHandler(async (req, res) => {
    const [totalExperiences, totalColleges, totalVerifiedExperiences, recentExperiences] = await Promise.all([
        InterviewExperience.count(),
        College.count(),
        InterviewExperience.count({ where: { isVerified: true } }),
        InterviewExperience.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [{ model: College, as: 'college', attributes: ['name'] }]
        })
    ]);

    const stats = {
        totalExperiences,
        totalColleges,
        totalVerifiedExperiences,
        pendingExperiences: totalExperiences - totalVerifiedExperiences,
        recentExperiences
    };

    return ApiResponse.success(res, stats, 'Admin statistics fetched successfully');
});

// --- EXPERIENCE ADMINISTRATION ---

const experienceIncludes = [
    {
        model: College,
        as: 'college',
        attributes: ['id', 'name']
    },
    {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
    }
];

exports.getAllAdminExperiences = asyncHandler(async (req, res) => {
    const experiences = await InterviewExperience.findAll({
        include: experienceIncludes,
        order: [['createdAt', 'DESC']]
    });
    return ApiResponse.success(res, experiences, 'All experiences fetched successfully');
});

exports.getPendingExperiences = asyncHandler(async (req, res) => {
    const experiences = await InterviewExperience.findAll({
        where: { isVerified: false },
        include: experienceIncludes,
        order: [['createdAt', 'DESC']]
    });
    return ApiResponse.success(res, experiences, 'Pending experiences fetched successfully');
});

exports.getVerifiedExperiences = asyncHandler(async (req, res) => {
    const experiences = await InterviewExperience.findAll({
        where: { isVerified: true },
        include: experienceIncludes,
        order: [['createdAt', 'DESC']]
    });
    return ApiResponse.success(res, experiences, 'Verified experiences fetched successfully');
});

exports.getAdminExperienceById = asyncHandler(async (req, res) => {
    const experience = await InterviewExperience.findByPk(req.params.id, {
        include: experienceIncludes
    });

    if (!experience) {
        throw new ApiError(404, 'Experience not found');
    }
    return ApiResponse.success(res, experience, 'Experience details fetched successfully');
});

exports.verifyExperience = asyncHandler(async (req, res) => {
    const experience = await InterviewExperience.findByPk(req.params.id);
    if (!experience) {
        throw new ApiError(404, 'Experience not found');
    }

    await experience.update({ isVerified: true });
    return ApiResponse.success(res, { id: experience.id, isVerified: true }, 'Experience verified successfully');
});

exports.rejectExperience = asyncHandler(async (req, res) => {
    const experience = await InterviewExperience.findByPk(req.params.id);
    if (!experience) {
        throw new ApiError(404, 'Experience not found');
    }

    await experience.destroy();
    return ApiResponse.success(res, null, 'Experience rejected and deleted successfully');
});

// --- COLLEGE ADMINISTRATION ---

exports.getAllAdminColleges = asyncHandler(async (req, res) => {
    const colleges = await College.findAll({
        order: [['name', 'ASC']]
    });
    return ApiResponse.success(res, colleges, 'Colleges fetched successfully');
});

exports.createCollege = asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) {
        throw new ApiError(400, 'College name is required');
    }

    const slug = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const existing = await College.findOne({
        where: { [Op.or]: [{ name }, { slug }] }
    });

    if (existing) {
        throw new ApiError(400, 'College with this name or slug already exists');
    }

    const college = await College.create({ name, slug });
    return ApiResponse.success(res, college, 'College created successfully', 201);
});

exports.updateCollege = asyncHandler(async (req, res) => {
    const college = await College.findByPk(req.params.id);
    if (!college) {
        throw new ApiError(404, 'College not found');
    }

    const { name, status } = req.body;
    if (name && name !== college.name) {
        const newSlug = name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

        const existing = await College.findOne({
            where: {
                id: { [Op.ne]: req.params.id },
                [Op.or]: [{ name }, { slug: newSlug }]
            }
        });

        if (existing) {
            throw new ApiError(400, 'Another college already uses this name or slug');
        }

        college.name = name;
        college.slug = newSlug;
    }

    if (status) college.status = status;

    await college.save();
    return ApiResponse.success(res, college, 'College updated successfully');
});

// --- USER ADMINISTRATION ---

exports.getAllAdminUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
        where: {
            [Op.or]: [
                { name: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } }
            ]
        },
        attributes: ['id', 'name', 'email', 'role', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
    });

    return ApiResponse.success(res, {
        users,
        pagination: {
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            limit: parseInt(limit)
        }
    }, 'Users fetched successfully');
});

exports.getAdminUserById = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.id, {
        attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
        include: [{
            model: InterviewExperience,
            as: 'interviewExperiences',
            limit: 10,
            order: [['createdAt', 'DESC']],
            include: [{ model: College, as: 'college', attributes: ['name'] }]
        }]
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    return ApiResponse.success(res, user, 'User details fetched successfully');
});
