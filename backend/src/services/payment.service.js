const crypto = require("crypto");
const mongoose = require("mongoose");
const razorpay = require("../config/razorpay");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const ApiError = require("../utils/ApiError");
const inventoryService = require("./inventory.service");

// --- Step 1: create a Razorpay order for an existing (unpaid) Order ---
async function createPaymentOrder(userId, orderId) {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  if (order.paymentStatus === "paid") {
    throw new ApiError(400, "This order has already been paid for");
  }
  if (order.status === "cancelled") {
    throw new ApiError(400, "This order has been cancelled");
  }

  // If the customer already has a "created" (not-yet-verified) payment
  // attempt for this order — e.g. they closed the Razorpay checkout and
  // came back — reuse it instead of creating a second Razorpay order for
  // the same purchase.
  let payment = await Payment.findOne({ order: order._id, status: "created" });

  if (!payment) {
    const razorpayOrder = await razorpay.orders.create({
      // Razorpay expects the amount in the smallest currency unit (paise for INR)
      amount: Math.round(order.pricing.total * 100),
      currency: "INR",
      receipt: order._id.toString(),
    });

    payment = await Payment.create({
      order: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: order.pricing.total,
      status: "created",
    });
  }

  return {
    razorpayOrderId: payment.razorpayOrderId,
    amount: payment.amount,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID, // the frontend needs this public key to open Razorpay's checkout
  };
}

// Razorpay's own signature scheme for the frontend-callback flow:
// HMAC-SHA256(razorpayOrderId + "|" + razorpayPaymentId) using our key
// secret, compared against what Razorpay sent back to the frontend. This
// proves the payment response actually came from Razorpay and wasn't
// forged by a malicious client claiming "payment succeeded".
function isSignatureValid(razorpayOrderId, razorpayPaymentId, signature) {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  return expectedSignature === signature;
}

// --- The single source of truth for "mark this payment as done" ---
// Called from BOTH the frontend-verify endpoint and the webhook handler,
// because we never trust the frontend callback alone (a compromised
// client could call /verify with a "success" that never really happened
// on Razorpay's side) — the webhook, verified independently against
// Razorpay's own webhook secret, is the real source of truth. Both paths
// funnel through here so the actual state change happens in one place.
//
// IDEMPOTENCY: this is what makes repeated webhook deliveries safe. We
// look up the Payment by razorpayOrderId and check its status BEFORE
// doing anything — if it's already "verified", we return immediately
// without touching stock or the order again. Combined with the unique
// index on Payment.razorpayOrderId, this guarantees stock is deducted
// and the order is marked paid exactly once, no matter how many times
// Razorpay (or a retried frontend request) calls this.
async function confirmPayment(razorpayOrderId, razorpayPaymentId, signature) {
  const payment = await Payment.findOne({ razorpayOrderId });
  if (!payment) {
    throw new ApiError(404, "Payment record not found for this Razorpay order");
  }

  if (payment.status === "verified") {
    return payment; // already processed — safe no-op, this IS the idempotency guarantee
  }

  const order = await Order.findById(payment.order);
  if (!order) {
    throw new ApiError(404, "Order not found for this payment");
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Stock is deducted HERE, atomically with marking the order paid —
      // this is the payoff of deferring deduction out of createOrder.
      await inventoryService.reduceStockForOrder(order.items, session);

      order.status = "confirmed";
      order.paymentStatus = "paid";
      await order.save({ session });

      payment.razorpayPaymentId = razorpayPaymentId;
      payment.signature = signature;
      payment.status = "verified";
      await payment.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return payment;
}

// --- Frontend-callback verification path ---
async function verifyPayment(userId, { razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const payment = await Payment.findOne({ razorpayOrderId });
  if (!payment) {
    throw new ApiError(404, "Payment record not found");
  }

  const order = await Order.findOne({ _id: payment.order, user: userId });
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (!isSignatureValid(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    payment.status = "failed";
    await payment.save();
    throw new ApiError(400, "Payment verification failed — signature mismatch");
  }

  return confirmPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
}

// --- Webhook path (the real source of truth) ---
// rawBody must be the exact, untouched request body bytes — Razorpay
// signs the raw JSON string, so re-serializing a parsed object would
// produce a different signature and always fail verification.
function isWebhookSignatureValid(rawBody, webhookSignature) {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return expectedSignature === webhookSignature;
}

async function handleWebhookEvent(rawBody, webhookSignature) {
  if (!isWebhookSignatureValid(rawBody, webhookSignature)) {
    throw new ApiError(400, "Invalid webhook signature");
  }

  const event = JSON.parse(rawBody);

  // We only act on payment.captured — other event types (e.g.
  // payment.failed, order.paid) are acknowledged with a 200 but not
  // processed, since a failed payment needs no state change here (the
  // order simply stays "pending"/unpaid, which is already correct).
  if (event.event === "payment.captured") {
    const paymentEntity = event.payload.payment.entity;
    // No signature to store here — the webhook's OWN signature (checked
    // above) is what verifies this event is genuinely from Razorpay.
    await confirmPayment(paymentEntity.order_id, paymentEntity.id, null);
  }
}

module.exports = { createPaymentOrder, verifyPayment, handleWebhookEvent, confirmPayment };
