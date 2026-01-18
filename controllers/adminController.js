const { InterviewExperience, College, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get administrative dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
exports.getAdminStats = asyncHandler(async (req, res) => {
    const [totalExperiences, totalColleges, totalVerifiedExperiences] = await Promise.all([
        InterviewExperience.count(),
        College.count(),
        InterviewExperience.count({ where: { isVerified: true } })
    ]);

    const stats = {
        totalExperiences,
        totalColleges,
        totalVerifiedExperiences,
        pendingExperiences: totalExperiences - totalVerifiedExperiences
    };

    res.json(stats);
});

// --- EXPERIENCE ADMINISTRATION ---

const experienceIncludes = [
    {
        model: College,
        as: 'college',
        attributes: ['id', 'name', 'slug']
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
    res.json(experiences);
});

exports.getPendingExperiences = asyncHandler(async (req, res) => {
    const experiences = await InterviewExperience.findAll({
        where: { isVerified: false },
        include: experienceIncludes,
        order: [['createdAt', 'DESC']]
    });
    res.json(experiences);
});

exports.getVerifiedExperiences = asyncHandler(async (req, res) => {
    const experiences = await InterviewExperience.findAll({
        where: { isVerified: true },
        include: experienceIncludes,
        order: [['createdAt', 'DESC']]
    });
    res.json(experiences);
});

exports.getAdminExperienceById = asyncHandler(async (req, res) => {
    const experience = await InterviewExperience.unscoped().findByPk(req.params.id, {
        include: experienceIncludes,
        paranoid: false
    });

    if (!experience) {
        return res.status(404).json({ error: 'Experience not found' });
    }
    res.json(experience);
});

exports.verifyExperience = asyncHandler(async (req, res) => {
    const experience = await InterviewExperience.unscoped().findByPk(req.params.id);
    if (!experience) {
        return res.status(404).json({ error: 'Experience not found' });
    }

    await experience.update({ isVerified: true });
    res.json({ message: 'Experience verified successfully', id: experience.id, isVerified: true });
});

exports.rejectExperience = asyncHandler(async (req, res) => {
    const experience = await InterviewExperience.findByPk(req.params.id);
    if (!experience) {
        return res.status(404).json({ error: 'Experience not found' });
    }
    await experience.destroy();
    res.json({ message: 'Experience rejected and deleted successfully' });
});

// --- COLLEGE ADMINISTRATION ---

exports.getAllAdminColleges = asyncHandler(async (req, res) => {
    const colleges = await College.findAll({ order: [['name', 'ASC']] });
    res.json({ message: 'Colleges fetched successfully', data: colleges });
});

exports.createCollege = asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'College name is required' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const existing = await College.findOne({ where: { [Op.or]: [{ name }, { slug }] } });

    if (existing) return res.status(400).json({ error: 'College already exists' });

    const college = await College.create({ name, slug, status: 'active' });
    res.status(201).json(college);
});

exports.updateCollege = asyncHandler(async (req, res) => {
    const college = await College.findByPk(req.params.id);
    if (!college) return res.status(404).json({ error: 'College not found' });

    const { name, status } = req.body;
    if (name && name !== college.name) {
        const newSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const existing = await College.findOne({
            where: { id: { [Op.ne]: req.params.id }, [Op.or]: [{ name }, { slug: newSlug }] }
        });
        if (existing) return res.status(400).json({ error: 'College already exists' });
        college.name = name;
        college.slug = newSlug;
    }
    if (status) college.status = status;

    await college.save();
    res.json({ message: 'College updated successfully', data: college });
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

    const totalPages = Math.ceil(count / limit);
    res.json({ users, pagination: { total: count, totalPages, currentPage: parseInt(page) } });
});

exports.getAdminUserById = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.id, {
        attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
        include: [{
            model: InterviewExperience,
            as: 'interviewExperiences',
            include: [{ model: College, as: 'college', attributes: ['name'] }]
        }]
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
});
