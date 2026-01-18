/**
 * Utility to catch errors in async express routes and pass them to the error handler.
 * This removes the need for repetitive try-catch blocks in controllers.
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
