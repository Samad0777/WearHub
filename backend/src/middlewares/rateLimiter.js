const rateLimit = require("express-rate-limit");

// A factory instead of one fixed limiter — sensitive routes (login,
// register, forgot-password) will use a stricter version of this in
// the auth phase, while normal browsing routes stay generous.
function createRateLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV !== "production",
    message: { success: false, message: message || "Too many requests, please try again later" },
  });
}

// General limiter applied to the whole app as a baseline safety net.
const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
});

// Stricter limiter for sensitive, abuse-prone auth endpoints (login,
// register, forgot-password, resend-verification, reset-password,
// refresh) — these are the routes attackers script against, so they get
// a much lower ceiling than normal browsing traffic.
const sensitiveAuthLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many attempts, please try again after 15 minutes",
});

module.exports = { createRateLimiter, generalLimiter, sensitiveAuthLimiter };
