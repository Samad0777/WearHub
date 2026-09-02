const { body, param } = require("express-validator");

const addItemValidator = [
  body("productId").isMongoId().withMessage("A valid productId is required"),
  body("variantId").isMongoId().withMessage("A valid variantId is required"),
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
];

const updateQuantityValidator = [
  param("itemId").isMongoId().withMessage("Invalid cart item id"),
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
];

const itemIdValidator = [param("itemId").isMongoId().withMessage("Invalid cart item id")];

module.exports = { addItemValidator, updateQuantityValidator, itemIdValidator };
