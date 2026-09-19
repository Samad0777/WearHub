const { body, param, query } = require("express-validator");

const variantValidator = body("variants")
  .isArray({ min: 1 })
  .withMessage("At least one variant is required");

const createProductValidator = [
  body("name").trim().notEmpty().withMessage("Product name is required"),
  body("description").optional().trim(),
  body("category").isMongoId().withMessage("A valid category id is required"),
  variantValidator,
  body("variants.*.sku").trim().notEmpty().withMessage("Variant SKU is required"),
  body("variants.*.price").isFloat({ min: 0 }).withMessage("Variant price must be a positive number"),
  body("variants.*.compareAtPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Variant compareAtPrice must be a positive number")
    // compareAtPrice is meant to show as a struck-through "original"
    // price next to the real one (e.g. MRP ₹1200, selling at ₹999) — it
    // only makes sense if it's higher than the actual price. A lower or
    // equal compareAtPrice is either a data-entry mistake or misleading,
    // so we reject it here rather than silently saving something wrong.
    .custom((value, { req, path }) => {
      const index = path.match(/variants\[(\d+)\]/)?.[1];
      const variant = req.body.variants?.[index];
      if (variant && Number(value) <= Number(variant.price)) {
        throw new Error("compareAtPrice must be greater than the actual price");
      }
      return true;
    }),
  body("variants.*.stock").isInt({ min: 0 }).withMessage("Variant stock must be a non-negative integer"),
  body("variants.*.attributes").optional().isObject().withMessage("Variant attributes must be an object"),
];

const updateProductValidator = [
  param("id").isMongoId().withMessage("Invalid product id"),
  body("name").optional().trim().notEmpty(),
  body("category").optional().isMongoId().withMessage("A valid category id is required"),
  body("variants").optional().isArray({ min: 1 }).withMessage("At least one variant is required"),
  body("variants.*.sku").optional().trim().notEmpty().withMessage("Variant SKU is required"),
  body("variants.*.price").optional().isFloat({ min: 0 }).withMessage("Variant price must be a positive number"),
  body("variants.*.compareAtPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Variant compareAtPrice must be a positive number")
    .custom((value, { req, path }) => {
      const index = path.match(/variants\[(\d+)\]/)?.[1];
      const variant = req.body.variants?.[index];
      if (variant?.price !== undefined && Number(value) <= Number(variant.price)) {
        throw new Error("compareAtPrice must be greater than the actual price");
      }
      return true;
    }),
  body("variants.*.stock").optional().isInt({ min: 0 }).withMessage("Variant stock must be a non-negative integer"),
];

const productIdValidator = [param("id").isMongoId().withMessage("Invalid product id")];

const productImageParamsValidator = [
  param("id").isMongoId().withMessage("Invalid product id"),
  param("imageId").isMongoId().withMessage("Invalid image id"),
];

const listProductsValidator = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("category").optional().isMongoId().withMessage("Invalid category id"),
  query("minPrice").optional().isFloat({ min: 0 }),
  query("maxPrice").optional().isFloat({ min: 0 }),
  query("sort").optional().isIn(["price_asc", "price_desc", "newest", "rating"]),
];

module.exports = {
  createProductValidator,
  updateProductValidator,
  productIdValidator,
  productImageParamsValidator,
  listProductsValidator,
};
