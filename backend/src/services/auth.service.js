const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const {
  generateAccessToken,
  generateRefreshToken,
  generateSecureToken,
  hashToken,
} = require("../utils/tokenUtils");
const tokenService = require("./token.service");
const emailService = require("./email.service");

// --- Register ---
async function register({ name, email, password }) {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const user = await User.create({ name, email, password });

  const { rawToken, hashedToken } = generateSecureToken();
  await tokenService.storeEmailVerificationToken(user._id.toString(), hashedToken);
  await emailService.sendVerificationEmail(user, rawToken);

  return user.toSafeObject();
}

// --- Login ---
async function login({ email, password }) {
  // .select("+password") because the schema excludes it by default
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid email or password");
  }

  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken();
  await tokenService.createSession(user._id.toString(), refreshToken);

  return { user: user.toSafeObject(), accessToken, refreshToken };
}

// --- Refresh (rotation) ---
async function refresh(oldRefreshToken) {
  if (!oldRefreshToken) {
    throw new ApiError(401, "Refresh token missing");
  }

  const userId = await tokenService.getSessionUserId(oldRefreshToken);
  if (!userId) {
    // Token not found in Redis — either it expired, was already rotated
    // and reused (possible theft), or was revoked by a logout. Either way,
    // we can't trust it: force a full re-login.
    throw new ApiError(401, "Session expired or invalid, please log in again");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }

  const newRefreshToken = generateRefreshToken();
  await tokenService.rotateSession(userId, oldRefreshToken, newRefreshToken);

  const newAccessToken = generateAccessToken(user._id.toString(), user.role);

  return { user: user.toSafeObject(), accessToken: newAccessToken, refreshToken: newRefreshToken };
}

// --- Logout ---
async function logout(userId, refreshToken) {
  if (userId && refreshToken) {
    await tokenService.revokeSession(userId, refreshToken);
  }
}

// --- Get current user ---
async function getCurrentUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user.toSafeObject();
}

// --- Email verification ---
async function verifyEmail(rawToken) {
  const hashedToken = hashToken(rawToken);
  const userId = await tokenService.consumeEmailVerificationToken(hashedToken);
  if (!userId) {
    throw new ApiError(400, "Verification link is invalid or has expired");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.emailVerified = true;
  await user.save();
}

async function resendVerification(email) {
  const user = await User.findOne({ email });
  // Don't reveal whether the account exists — same generic behavior as
  // forgot-password, for the same reason (prevents email enumeration).
  if (!user || user.emailVerified) return;

  const { rawToken, hashedToken } = generateSecureToken();
  await tokenService.storeEmailVerificationToken(user._id.toString(), hashedToken);
  await emailService.sendVerificationEmail(user, rawToken);
}

// --- Forgot / reset password ---
async function forgotPassword(email) {
  const user = await User.findOne({ email });
  if (!user) return; // generic response regardless — handled in controller

  const { rawToken, hashedToken } = generateSecureToken();
  await tokenService.storePasswordResetToken(user._id.toString(), hashedToken);
  await emailService.sendPasswordResetEmail(user, rawToken);
}

async function resetPassword(rawToken, newPassword) {
  const hashedToken = hashToken(rawToken);
  const userId = await tokenService.consumePasswordResetToken(hashedToken);
  if (!userId) {
    throw new ApiError(400, "Reset link is invalid or has expired");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.password = newPassword; // pre-save hook re-hashes it
  await user.save();

  // A password reset means the account may have just been recovered from
  // compromise — kill every existing session so old (possibly stolen)
  // refresh tokens stop working too.
  await tokenService.revokeAllSessions(userId);
}

// --- Change password (authenticated) ---
async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordCorrect) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  // Same reasoning as resetPassword — revoke all other sessions so a
  // stolen refresh token can't keep an old session alive after the
  // legitimate user has changed their password.
  await tokenService.revokeAllSessions(userId);
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getCurrentUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
};
