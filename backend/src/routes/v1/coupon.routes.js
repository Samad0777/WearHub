const express = require("express");
const couponController = require("../../controllers/coupon.controller");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate");
const {
  createCouponValidator,
  updateCouponValidator,
  couponIdValidator,
  validateCouponValidator,
} = require("../../validators/coupon.validator");

const router = express.Router();

// --- Customer: check a coupon before placing an order ---
router.post("/validate", authenticate, validateCouponValidator, validate, couponController.validateCoupon);

// --- Admin only ---
router.get("/", authenticate, authorize("admin"), couponController.listCoupons);
router.post("/", authenticate, authorize("admin"), createCouponValidator, validate, couponController.createCoupon);
router.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  updateCouponValidator,
  validate,
  couponController.updateCoupon
);
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  couponIdValidator,
  validate,
  couponController.deactivateCoupon
);

module.exports = router;
