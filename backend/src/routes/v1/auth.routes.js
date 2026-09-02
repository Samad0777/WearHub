const express = require("express");
const authController = require("../../controllers/auth.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const { sensitiveAuthLimiter } = require("../../middlewares/rateLimiter");
const validate = require("../../middlewares/validate");
const {
  registerValidator,
  loginValidator,
  emailOnlyValidator,
  verifyEmailValidator,
  resetPasswordValidator,
  changePasswordValidator,
} = require("../../validators/auth.validator");

const router = express.Router();

// --- Public routes ---
router.post("/register", sensitiveAuthLimiter, registerValidator, validate, authController.register);
router.post("/login", sensitiveAuthLimiter, loginValidator, validate, authController.login);
router.post("/refresh", sensitiveAuthLimiter, authController.refresh);
router.post("/verify-email", verifyEmailValidator, validate, authController.verifyEmail);
router.post(
  "/resend-verification",
  sensitiveAuthLimiter,
  emailOnlyValidator,
  validate,
  authController.resendVerification
);
router.post(
  "/forgot-password",
  sensitiveAuthLimiter,
  emailOnlyValidator,
  validate,
  authController.forgotPassword
);
router.post(
  "/reset-password",
  sensitiveAuthLimiter,
  resetPasswordValidator,
  validate,
  authController.resetPassword
);

// --- Protected routes (require a valid access token) ---
router.get("/me", authenticate, authController.getMe);
router.post("/logout", authenticate, authController.logout);
router.post(
  "/change-password",
  authenticate,
  changePasswordValidator,
  validate,
  authController.changePassword
);

module.exports = router;
