const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// --- Access token: a real JWT, short-lived, verified statelessly on every
// request (no DB/Redis lookup needed — that's the whole point of a JWT). ---
function generateAccessToken(userId, role) {
  return jwt.sign({ sub: userId, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

// --- Refresh token: NOT a JWT — just a random opaque string. Its identity
// lives in Redis (see redisSession.service.js), which is what lets us
// revoke it instantly. A JWT refresh token would still be "valid" to
// jwt.verify() even after we wanted to kill it. ---
function generateRefreshToken() {
  return crypto.randomBytes(40).toString("hex");
}

// --- Generic secure random token for email verification / password reset.
// We only ever store a HASH of this in the DB/Redis — the raw token is
// emailed to the user and never persisted anywhere. That way, even if our
// database is ever leaked, the leaked hashes can't be used to verify
// emails or reset passwords. ---
function generateSecureToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, hashedToken };
}

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  generateSecureToken,
  hashToken,
};
