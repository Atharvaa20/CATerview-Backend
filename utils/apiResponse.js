/**
 * @description Standardized API Response utility.
 */
class ApiResponse {
    constructor(statusCode, data, message = 'Success') {
        this.statusCode = statusCode;
        this.success = statusCode < 400;
        this.message = message;
        this.data = data;
    }

    static success(res, data, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
    }

    static error(res, message = 'Error', statusCode = 500, data = null) {
        return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
    }
}

module.exports = ApiResponse;
