const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { verifyAccessToken } = require("../utils/tokenUtils");

// Answers: "Who is this?" — verifies the access token and attaches a
// minimal req.user ({id, role}) for downstream handlers to use.
const authenticate = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Authentication required");
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    // Covers both expired and malformed/tampered tokens — same generic
    // message either way, so we don't leak which case it was.
    throw new ApiError(401, "Invalid or expired access token");
  }

  req.user = { id: decoded.sub, role: decoded.role };
  next();
});

// Answers: "What is this user allowed to do?" — a factory so routes can
// say authorize("admin") and get a reusable, readable check.
// IMPORTANT: this must always run AFTER authenticate.
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      // Defensive check — signals a route was wired wrong (authorize
      // used without authenticate first), not a real client error.
      throw new ApiError(401, "Authentication required");
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, "You do not have permission to perform this action");
    }
    next();
  };
}

module.exports = { authenticate, authorize };
