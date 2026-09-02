const express = require("express");
const paymentController = require("../../controllers/payment.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate");
const {
  createPaymentOrderValidator,
  verifyPaymentValidator,
} = require("../../validators/payment.validator");

const router = express.Router();

// Webhook is deliberately NOT behind `authenticate` — Razorpay's servers
// call it directly with no user session; its own HMAC signature (checked
// in the controller) is what proves authenticity instead.
router.post("/webhook", paymentController.webhook);

router.post(
  "/orders/:orderId",
  authenticate,
  createPaymentOrderValidator,
  validate,
  paymentController.createPaymentOrder
);
router.post("/verify", authenticate, verifyPaymentValidator, validate, paymentController.verifyPayment);

module.exports = router;
