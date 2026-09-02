const express = require("express");
const productController = require("../../controllers/product.controller");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate");
const upload = require("../../middlewares/upload");
const {
  createProductValidator,
  updateProductValidator,
  productIdValidator,
  productImageParamsValidator,
  listProductsValidator,
} = require("../../validators/product.validator");

const router = express.Router();

// --- Public ---
router.get("/", listProductsValidator, validate, productController.listProducts);
router.get("/:slug", productController.getProductBySlug);

// --- Admin only ---
router.post(
  "/",
  authenticate,
  authorize("admin"),
  createProductValidator,
  validate,
  productController.createProduct
);
router.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  updateProductValidator,
  validate,
  productController.updateProduct
);
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  productIdValidator,
  validate,
  productController.deactivateProduct
);
router.post(
  "/:id/images",
  authenticate,
  authorize("admin"),
  productIdValidator,
  validate,
  upload.single("image"),
  productController.addProductImage
);
router.delete(
  "/:id/images/:imageId",
  authenticate,
  authorize("admin"),
  productImageParamsValidator,
  validate,
  productController.removeProductImage
);

module.exports = router;
