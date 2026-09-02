const { body, param, query } = require("express-validator");

const createReviewValidator = [
  param("productId").isMongoId().withMessage("Invalid product id"),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment").optional().trim().isLength({ max: 1000 }).withMessage("Comment is too long"),
];

const updateReviewValidator = [
  param("id").isMongoId().withMessage("Invalid review id"),
  body("rating").optional().isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment").optional().trim().isLength({ max: 1000 }).withMessage("Comment is too long"),
];

const reviewIdValidator = [param("id").isMongoId().withMessage("Invalid review id")];

const productIdParamValidator = [param("productId").isMongoId().withMessage("Invalid product id")];

const listReviewsValidator = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
];

module.exports = {
  createReviewValidator,
  updateReviewValidator,
  reviewIdValidator,
  productIdParamValidator,
  listReviewsValidator,
};
