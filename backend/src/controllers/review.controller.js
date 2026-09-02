const catchAsync = require("../utils/catchAsync");
const ApiResponse = require("../utils/ApiResponse");
const reviewService = require("../services/review.service");

const createReview = catchAsync(async (req, res) => {
  const review = await reviewService.createReview(req.user.id, req.params.productId, req.body);
  res.status(201).json(new ApiResponse("Review submitted successfully", review));
});

const getProductReviews = catchAsync(async (req, res) => {
  const { reviews, pagination } = await reviewService.getProductReviews(req.params.productId, req.query);
  res.status(200).json({ success: true, message: "Reviews fetched successfully", data: reviews, pagination });
});

const updateReview = catchAsync(async (req, res) => {
  const review = await reviewService.updateReview(req.user.id, req.params.id, req.body);
  res.status(200).json(new ApiResponse("Review updated successfully", review));
});

const deleteReview = catchAsync(async (req, res) => {
  await reviewService.deleteReview(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse("Review deleted successfully"));
});

module.exports = { createReview, getProductReviews, updateReview, deleteReview };
