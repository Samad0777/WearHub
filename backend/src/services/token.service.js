const redisClient = require("../config/redis");

const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days — keep in sync with REFRESH_TOKEN_EXPIRY
const EMAIL_VERIFY_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const PASSWORD_RESET_TTL_SECONDS = 15 * 60; // 15 minutes — short, since it's a higher-risk action

// --- Refresh-token sessions ---
// Key: session:<refreshToken>  -> userId
// Key: user_sessions:<userId>  -> Set of active refresh tokens for that user
// The second index is what lets us revoke ALL of a user's sessions at once
// (e.g. on suspected theft, or on password change).

async function createSession(userId, refreshToken) {
  await redisClient.set(`session:${refreshToken}`, userId, "EX", REFRESH_TOKEN_TTL_SECONDS);
  await redisClient.sadd(`user_sessions:${userId}`, refreshToken);
  await redisClient.expire(`user_sessions:${userId}`, REFRESH_TOKEN_TTL_SECONDS);
}

async function getSessionUserId(refreshToken) {
  return redisClient.get(`session:${refreshToken}`);
}

async function revokeSession(userId, refreshToken) {
  await redisClient.del(`session:${refreshToken}`);
  await redisClient.srem(`user_sessions:${userId}`, refreshToken);
}

// Used on refresh-token rotation: delete the old session, create the new one.
async function rotateSession(userId, oldRefreshToken, newRefreshToken) {
  await revokeSession(userId, oldRefreshToken);
  await createSession(userId, newRefreshToken);
}

// Used on password change / suspected token theft — kills every active
// session for this user, forcing re-login everywhere.
async function revokeAllSessions(userId) {
  const tokens = await redisClient.smembers(`user_sessions:${userId}`);
  if (tokens.length > 0) {
    const sessionKeys = tokens.map((t) => `session:${t}`);
    await redisClient.del(...sessionKeys);
  }
  await redisClient.del(`user_sessions:${userId}`);
}

// --- Short-lived single-use tokens (email verification, password reset) ---
// Key: email_verify:<hashedToken> -> userId
// Key: password_reset:<hashedToken> -> userId
// Storing these in Redis (instead of a field on the User document) means
// expiry is automatic (TTL) and "single-use" is just "delete after use" —
// no manual cleanup job needed.

async function storeEmailVerificationToken(userId, hashedToken) {
  await redisClient.set(`email_verify:${hashedToken}`, userId, "EX", EMAIL_VERIFY_TTL_SECONDS);
}

async function consumeEmailVerificationToken(hashedToken) {
  const userId = await redisClient.get(`email_verify:${hashedToken}`);
  if (userId) await redisClient.del(`email_verify:${hashedToken}`);
  return userId; // null if not found/expired
}

async function storePasswordResetToken(userId, hashedToken) {
  await redisClient.set(`password_reset:${hashedToken}`, userId, "EX", PASSWORD_RESET_TTL_SECONDS);
}

async function consumePasswordResetToken(hashedToken) {
  const userId = await redisClient.get(`password_reset:${hashedToken}`);
  if (userId) await redisClient.del(`password_reset:${hashedToken}`);
  return userId; // null if not found/expired
}

module.exports = {
  createSession,
  getSessionUserId,
  revokeSession,
  rotateSession,
  revokeAllSessions,
  storeEmailVerificationToken,
  consumeEmailVerificationToken,
  storePasswordResetToken,
  consumePasswordResetToken,
};
