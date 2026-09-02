const catchAsync = require("../utils/catchAsync");
const ApiResponse = require("../utils/ApiResponse");
const couponService = require("../services/coupon.service");

const createCoupon = catchAsync(async (req, res) => {
  const coupon = await couponService.createCoupon(req.body);
  res.status(201).json(new ApiResponse("Coupon created successfully", coupon));
});

const listCoupons = catchAsync(async (req, res) => {
  const coupons = await couponService.listCoupons();
  res.status(200).json(new ApiResponse("Coupons fetched successfully", coupons));
});

const updateCoupon = catchAsync(async (req, res) => {
  const coupon = await couponService.updateCoupon(req.params.id, req.body);
  res.status(200).json(new ApiResponse("Coupon updated successfully", coupon));
});

const deactivateCoupon = catchAsync(async (req, res) => {
  await couponService.deactivateCoupon(req.params.id);
  res.status(200).json(new ApiResponse("Coupon deactivated successfully"));
});

// Lets the frontend show the discount at checkout before the order is
// actually placed — same validation logic createOrder uses internally.
const validateCoupon = catchAsync(async (req, res) => {
  const { code, subtotal } = req.body;
  const { discount } = await couponService.validateAndCalculateDiscount(code, subtotal);
  res.status(200).json(new ApiResponse("Coupon is valid", { discount, total: subtotal - discount }));
});

module.exports = { createCoupon, listCoupons, updateCoupon, deactivateCoupon, validateCoupon };
