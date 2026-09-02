const catchAsync = require("../utils/catchAsync");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const paymentService = require("../services/payment.service");

const createPaymentOrder = catchAsync(async (req, res) => {
  const paymentDetails = await paymentService.createPaymentOrder(req.user.id, req.params.orderId);
  res.status(200).json(new ApiResponse("Razorpay order created", paymentDetails));
});

const verifyPayment = catchAsync(async (req, res) => {
  const payment = await paymentService.verifyPayment(req.user.id, req.body);
  res.status(200).json(new ApiResponse("Payment verified successfully", payment));
});

// Public endpoint (Razorpay's servers call this, not the browser) — no
// access token, authenticated instead by the webhook signature itself.
const webhook = catchAsync(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  if (!signature) {
    throw new ApiError(400, "Missing webhook signature header");
  }
  if (!req.rawBody) {
    throw new ApiError(500, "Raw request body unavailable for signature verification");
  }

  await paymentService.handleWebhookEvent(req.rawBody, signature);

  // Razorpay expects a fast 200 acknowledgment — respond simply, without
  // exposing any internal detail about what we did with the event.
  res.status(200).json({ success: true, message: "Webhook processed" });
});

module.exports = { createPaymentOrder, verifyPayment, webhook };
