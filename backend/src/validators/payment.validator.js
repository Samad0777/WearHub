const { body, param } = require("express-validator");

const createPaymentOrderValidator = [param("orderId").isMongoId().withMessage("Invalid order id")];

const verifyPaymentValidator = [
  body("razorpayOrderId").notEmpty().withMessage("razorpayOrderId is required"),
  body("razorpayPaymentId").notEmpty().withMessage("razorpayPaymentId is required"),
  body("razorpaySignature").notEmpty().withMessage("razorpaySignature is required"),
];

module.exports = { createPaymentOrderValidator, verifyPaymentValidator };
