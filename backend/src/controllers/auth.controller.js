const catchAsync = require("../utils/catchAsync");
const ApiResponse = require("../utils/ApiResponse");
const authService = require("../services/auth.service");

// Centralized cookie options so every place that sets/clears the refresh
// cookie uses identical settings (mismatched options is a common bug —
// e.g. clearing with different `path` silently fails to clear it).
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true, // JS on the frontend can never read this — blocks XSS token theft
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches REFRESH_TOKEN_EXPIRY
  path: "/api/v1/auth", // only sent back to auth routes, not every request
};

const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await authService.register({ name, email, password });
  res
    .status(201)
    .json(new ApiResponse("Registered successfully. Please check your email to verify your account.", user));
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login({ email, password });

  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
  res.status(200).json(new ApiResponse("Logged in successfully", { user, accessToken }));
});

const refresh = catchAsync(async (req, res) => {
  const oldRefreshToken = req.cookies.refreshToken;
  const { user, accessToken, refreshToken } = await authService.refresh(oldRefreshToken);

  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
  res.status(200).json(new ApiResponse("Token refreshed successfully", { user, accessToken }));
});

const logout = catchAsync(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  await authService.logout(req.user?.id, refreshToken);

  res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);
  res.status(200).json(new ApiResponse("Logged out successfully"));
});

const getMe = catchAsync(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);
  res.status(200).json(new ApiResponse("User fetched successfully", user));
});

const verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.body;
  await authService.verifyEmail(token);
  res.status(200).json(new ApiResponse("Email verified successfully"));
});

const resendVerification = catchAsync(async (req, res) => {
  const { email } = req.body;
  await authService.resendVerification(email);
  res
    .status(200)
    .json(new ApiResponse("If an account with this email exists and is unverified, a verification link has been sent."));
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword(email);
  // Generic message regardless of outcome — never confirm/deny whether
  // the email is registered (prevents attackers from enumerating users).
  res.status(200).json(new ApiResponse("If an account exists with this email, a password reset link has been sent."));
});

const resetPassword = catchAsync(async (req, res) => {
  const { token, newPassword } = req.body;
  await authService.resetPassword(token, newPassword);
  res.status(200).json(new ApiResponse("Password reset successfully. Please log in with your new password."));
});

const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  res.status(200).json(new ApiResponse("Password changed successfully. Please log in again."));
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
};
