const { body, param } = require("express-validator");

const createCouponValidator = [
  body("code").trim().notEmpty().withMessage("Coupon code is required"),
  body("discountType").isIn(["percentage", "flat"]).withMessage("discountType must be 'percentage' or 'flat'"),
  body("discountValue").isFloat({ min: 0 }).withMessage("discountValue must be a positive number"),
  body("minOrderAmount").optional().isFloat({ min: 0 }),
  body("expiresAt").isISO8601().withMessage("A valid expiresAt date is required"),
  body("usageLimit").optional().isInt({ min: 1 }),
];

const updateCouponValidator = [
  param("id").isMongoId().withMessage("Invalid coupon id"),
  body("discountType").optional().isIn(["percentage", "flat"]),
  body("discountValue").optional().isFloat({ min: 0 }),
  body("minOrderAmount").optional().isFloat({ min: 0 }),
  body("expiresAt").optional().isISO8601(),
  body("usageLimit").optional().isInt({ min: 1 }),
  body("isActive").optional().isBoolean(),
];

const couponIdValidator = [param("id").isMongoId().withMessage("Invalid coupon id")];

const validateCouponValidator = [
  body("code").trim().notEmpty().withMessage("Coupon code is required"),
  body("subtotal").isFloat({ min: 0 }).withMessage("A valid subtotal is required"),
];

module.exports = { createCouponValidator, updateCouponValidator, couponIdValidator, validateCouponValidator };
