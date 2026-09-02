const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    // Unique index here is what makes webhook processing idempotent: a
    // duplicate webhook delivery for the same Razorpay order would try to
    // create a second Payment with the same razorpayOrderId, which is
    // impossible — but we don't even rely on that failing, because we
    // look the payment up by this field FIRST and check its status
    // before doing anything (see payment.service.js confirmPayment).
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
    },
    signature: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["created", "verified", "failed"],
      default: "created",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
