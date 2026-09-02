const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");
const ApiError = require("../utils/ApiError");
const { parsePagination, buildPaginationMeta } = require("../utils/pagination");

// Eligibility rule: a user can review a product if they have at least
// one PAID order containing it — "purchased" is interpreted as "paid
// for", not "delivered", since payment is the point where the business
// relationship is real; waiting for delivery would also require a
// separate mechanism to know delivery happened, which the order status
// already gives an admin control over but isn't automatic yet.
async function hasUserPurchasedProduct(userId, productId) {
  const order = await Order.exists({
    user: userId,
    "items.product": productId,
    paymentStatus: "paid",
  });
  return Boolean(order);
}

// Recomputes a product's ratingAvg/ratingCount from its actual reviews —
// called after every create/update/delete so the cached fields on
// Product never drift from the source of truth.
async function recalculateProductRating(productId) {
  const [stats] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: "$product", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  await Product.findByIdAndUpdate(productId, {
    ratingAvg: stats ? Math.round(stats.avg * 10) / 10 : 0,
    ratingCount: stats ? stats.count : 0,
  });
}

async function createReview(userId, productId, { rating, comment }) {
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const purchased = await hasUserPurchasedProduct(userId, productId);
  if (!purchased) {
    throw new ApiError(403, "You can only review products you have purchased");
  }

  const existingReview = await Review.findOne({ user: userId, product: productId });
  if (existingReview) {
    throw new ApiError(409, "You have already reviewed this product");
  }

  const review = await Review.create({ user: userId, product: productId, rating, comment });
  await recalculateProductRating(productId);
  return review;
}

async function getProductReviews(productId, query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { product: productId };

  const [reviews, total] = await Promise.all([
    Review.find(filter).populate("user", "name").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Review.countDocuments(filter),
  ]);

  return { reviews, pagination: buildPaginationMeta(page, limit, total) };
}

async function updateReview(userId, reviewId, updates) {
  const review = await Review.findOne({ _id: reviewId, user: userId });
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  Object.assign(review, updates);
  await review.save();
  await recalculateProductRating(review.product);
  return review;
}

async function deleteReview(userId, reviewId) {
  const review = await Review.findOne({ _id: reviewId, user: userId });
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  const productId = review.product;
  await review.deleteOne();
  await recalculateProductRating(productId);
}

module.exports = { createReview, getProductReviews, updateReview, deleteReview };
