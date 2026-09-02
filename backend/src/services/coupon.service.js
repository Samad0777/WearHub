const Coupon = require("../models/Coupon");
const ApiError = require("../utils/ApiError");

async function createCoupon(data) {
  const code = data.code.toUpperCase();
  const existing = await Coupon.findOne({ code });
  if (existing) {
    throw new ApiError(409, "A coupon with this code already exists");
  }
  return Coupon.create({ ...data, code });
}

async function listCoupons() {
  return Coupon.find().sort({ createdAt: -1 });
}

async function updateCoupon(id, updates) {
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }
  if (updates.code) updates.code = updates.code.toUpperCase();
  Object.assign(coupon, updates);
  await coupon.save();
  return coupon;
}

async function deactivateCoupon(id) {
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }
  coupon.isActive = false;
  await coupon.save();
  return coupon;
}

// The backend is authoritative here — the discount is always recalculated
// server-side from the coupon's rules and the server-computed subtotal,
// never trusting a discount amount the frontend might send.
async function validateAndCalculateDiscount(code, subtotal) {
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) {
    throw new ApiError(404, "Invalid coupon code");
  }
  if (coupon.expiresAt < new Date()) {
    throw new ApiError(400, "This coupon has expired");
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, "This coupon has reached its usage limit");
  }
  if (subtotal < coupon.minOrderAmount) {
    throw new ApiError(400, `A minimum order amount of ${coupon.minOrderAmount} is required for this coupon`);
  }

  const rawDiscount =
    coupon.discountType === "percentage" ? (subtotal * coupon.discountValue) / 100 : coupon.discountValue;

  // Never let the discount exceed the subtotal (e.g. a flat ₹500 coupon
  // on a ₹300 order shouldn't produce a negative total).
  const discount = Math.min(rawDiscount, subtotal);

  return { coupon, discount };
}

module.exports = { createCoupon, listCoupons, updateCoupon, deactivateCoupon, validateAndCalculateDiscount };
