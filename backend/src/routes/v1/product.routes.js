const express = require("express");
const productController = require("../../controllers/product.controller");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate");
const upload = require("../../middlewares/upload");
const parseProductFormData = require("../../middlewares/parseProductFormData");
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
//
// Accepts EITHER plain JSON (no images, same as before) OR
// multipart/form-data with up to 6 files under the "images" field, sent
// alongside the product fields in one request. `uploadProductImages`
// (multer) only touches the request when the content-type is actually
// multipart — a JSON request passes through it untouched, so both modes
// work on this same endpoint. `parseProductFormData` then turns the
// `variants` field back into a real array (multipart sends it as a JSON
// string), since multer can't parse nested objects in form fields itself.
router.post(
  "/",
  authenticate,
  authorize("admin"),
  upload.uploadProductImages,
  parseProductFormData,
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
// Still available for adding/replacing individual images AFTER creation
// (e.g. one upload failed at creation time, or a product needs a new
// photo later) — not removed, just no longer the only way to add images.
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
