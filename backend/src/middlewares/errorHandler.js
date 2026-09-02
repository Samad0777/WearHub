const ApiError = require("../utils/ApiError");

// This must be registered LAST in app.js (after all routes) — Express
// recognizes it as an error handler because it takes 4 arguments.
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong";

  // Common Mongoose errors get translated into clean, expected responses
  // instead of leaking raw driver error text to the client.
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource id";
  }
  if (err.code === 11000) {
    // Duplicate key error (e.g. email or SKU already exists)
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `${field} already exists` : "Duplicate value";
  }
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // Anything that wasn't an expected ApiError (or the translated cases
  // above) is a bug — log the full error server-side, but never leak
  // stack traces or internal details to the client, especially in prod.
  if (!(err instanceof ApiError) && statusCode === 500) {
    console.error("UNEXPECTED ERROR:", err);
    if (process.env.NODE_ENV === "production") {
      message = "Internal server error";
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = errorHandler;
