const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize');
const { sendOtpEmail, sendPasswordResetOtpEmail } = require('../services/emailService');
const { generateOTP, getOtpExpiryTime, isOtpExpired } = require('../utils/otpGenerator');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Register a new user & send OTP
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        throw new ApiError(400, 'All fields (name, email, password) are required');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
        if (existingUser.isVerified) {
            throw new ApiError(400, 'Email already registered and verified');
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

    return ApiResponse.success(res, { email }, 'Verification OTP sent to your email');
});

/**
 * @desc    Verify OTP and activate user
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
exports.verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        throw new ApiError(400, 'Email and OTP are required');
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (user.otp !== otp || isOtpExpired(user.otpExpires)) {
        throw new ApiError(400, 'Invalid or expired OTP');
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const expiresIn = process.env.JWT_EXPIRE || process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn }
    );

    return ApiResponse.success(res, {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token
    }, 'Email verified successfully');
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, 'Email and password are required');
    }

    const user = await User.findOne({ where: { email } });

    if (!user || !user.isVerified) {
        throw new ApiError(401, 'Invalid credentials or unverified account');
    }

    const isValidPassword = await user.validPassword(password);
    if (!isValidPassword) {
        throw new ApiError(401, 'Invalid credentials');
    }

    const expiresIn = process.env.JWT_EXPIRE || process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn }
    );

    return ApiResponse.success(res, {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token
    }, 'Login successful');
});

/**
 * @desc    Forgot Password - Send OTP
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, 'Email is required');
    }

    const user = await User.findOne({ where: { email } });
    if (user) {
        const otp = generateOTP();
        const otpExpires = getOtpExpiryTime();

        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpires = otpExpires;
        await user.save();

        await sendPasswordResetOtpEmail(email, otp);
    }

    // Always return same message for security reasons
    return ApiResponse.success(res, null, 'If your email is registered, you will receive an OTP');
});

/**
 * @desc    Reset Password with OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        throw new ApiError(400, 'Missing required fields');
    }

    if (newPassword.length < 6) {
        throw new ApiError(400, 'Password must be at least 6 characters long');
    }

    const user = await User.findOne({
        where: {
            email,
            resetPasswordOtp: otp,
            resetPasswordOtpExpires: { [Op.gt]: new Date() }
        }
    });

    if (!user) {
        throw new ApiError(400, 'Invalid or expired OTP');
    }

    user.password = newPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpires = null;
    await user.save();

    return ApiResponse.success(res, null, 'Password has been reset successfully');
});

/**
 * @desc    Resend Verification OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
exports.resendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, 'Email is required');
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const otp = generateOTP();
    const otpExpires = getOtpExpiryTime();

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendOtpEmail(email, otp);

    return ApiResponse.success(res, null, 'New OTP sent to your email');
});
