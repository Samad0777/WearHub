const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

// Runs after a route's express-validator chain(s). Collects all errors
// into a single readable message instead of the default nested array —
// keeps every error response in the app the same shape.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const message = errors
    .array()
    .map((e) => e.msg)
    .join(", ");

  next(new ApiError(400, message));
}

module.exports = validate;
