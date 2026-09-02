const express = require("express");
const reviewController = require("../../controllers/review.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate");
const {
  createReviewValidator,
  updateReviewValidator,
  reviewIdValidator,
  productIdParamValidator,
  listReviewsValidator,
} = require("../../validators/review.validator");

const router = express.Router();

// --- Public ---
router.get("/product/:productId", productIdParamValidator, listReviewsValidator, validate, reviewController.getProductReviews);

// --- Authenticated ---
router.post("/product/:productId", authenticate, createReviewValidator, validate, reviewController.createReview);
router.patch("/:id", authenticate, updateReviewValidator, validate, reviewController.updateReview);
router.delete("/:id", authenticate, reviewIdValidator, validate, reviewController.deleteReview);

module.exports = router;
