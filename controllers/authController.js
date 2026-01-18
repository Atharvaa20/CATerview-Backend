const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize');
const { sendOtpEmail, sendPasswordResetOtpEmail } = require('../services/emailService');
const { generateOTP, getOtpExpiryTime, isOtpExpired } = require('../utils/otpGenerator');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Register a new user & send OTP
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
        if (existingUser.isVerified) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        // Update existing unverified user
        existingUser.name = name;
        existingUser.password = password;
        await existingUser.save();
    } else {
        // Create new user
        await User.create({ name, email, password, isVerified: false });
    }

    // Generate and send OTP
    const otp = generateOTP();
    const otpExpires = getOtpExpiryTime();

    await User.update({ otp, otpExpires }, { where: { email } });
    await sendOtpEmail(email, otp);

    res.status(200).json({
        message: 'Verification OTP sent to your email',
        email
    });
});

/**
 * @desc    Verify OTP and activate user
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
exports.verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    if (user.otp !== otp || isOtpExpired(user.otpExpires)) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // Fix: Ensure expiresIn is a valid truthy string or number
    const expiresIn = process.env.JWT_EXPIRE || process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn }
    );

    res.status(200).json({
        message: 'Email verified successfully',
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token
    });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user || !user.isVerified) {
        return res.status(401).json({ error: 'Invalid credentials or unverified account' });
    }

    const isValidPassword = await user.validPassword(password);
    if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Fix: Ensure expiresIn is a valid truthy string or number
    const expiresIn = process.env.JWT_EXPIRE || process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn }
    );

    res.json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token
    });
});

/**
 * @desc    Forgot Password - Send OTP
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (user) {
        const otp = generateOTP();
        const otpExpires = getOtpExpiryTime();

        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpires = otpExpires;
        await user.save();

        await sendPasswordResetOtpEmail(email, otp);
    }

    // Same message for security
    res.json({ message: 'If your email is registered, you will receive an OTP' });
});

/**
 * @desc    Reset Password with OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({
        where: {
            email,
            resetPasswordOtp: otp,
            resetPasswordOtpExpires: { [Op.gt]: new Date() }
        }
    });

    if (!user) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    user.password = newPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpires = null;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
});

/**
 * @desc    Resend Verification OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
exports.resendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const otp = generateOTP();
    const otpExpires = getOtpExpiryTime();

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendOtpEmail(email, otp);

    res.json({ message: 'New OTP sent to your email' });
});
