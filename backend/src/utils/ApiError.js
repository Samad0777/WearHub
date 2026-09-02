// Custom error class so we can throw errors with a specific HTTP status
// from anywhere (controllers, services) and have the central error
// middleware turn them into a consistent JSON response.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // marks this as an expected, "safe to show" error
  }
}

module.exports = ApiError;
