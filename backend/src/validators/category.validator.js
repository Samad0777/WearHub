const { body, param } = require("express-validator");

const createCategoryValidator = [
  body("name").trim().notEmpty().withMessage("Category name is required"),
  body("description").optional().trim(),
];

const updateCategoryValidator = [
  param("id").isMongoId().withMessage("Invalid category id"),
  body("name").optional().trim().notEmpty().withMessage("Category name cannot be empty"),
  body("description").optional().trim(),
  body("isActive").optional().isBoolean().withMessage("isActive must be a boolean"),
];

const categoryIdValidator = [param("id").isMongoId().withMessage("Invalid category id")];

module.exports = { createCategoryValidator, updateCategoryValidator, categoryIdValidator };
