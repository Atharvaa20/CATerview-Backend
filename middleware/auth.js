const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Middleware to authenticate requests using JWT
 */
const auth = asyncHandler(async (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null;

  if (!token) {
    throw new ApiError(401, 'Please authenticate: No token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.userId);

    if (!user) {
      throw new ApiError(401, 'The user belonging to this token no longer exists');
    }

    if (!user.isVerified) {
      throw new ApiError(401, 'Please verify your email to access this resource');
    }

    // Attach user and token to request object
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Invalid token. Please log in again.');
    }
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Your token has expired. Please log in again.');
    }
    throw error;
  }
});

/**
 * Middleware to restrict access to specific roles
 * @param {...string} roles - Allowed roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }
    next();
  };
};

/**
 * Convenience middleware for admin-only routes
 */
const admin = [auth, restrictTo('admin')];

module.exports = {
  auth,
  restrictTo,
  admin
};
