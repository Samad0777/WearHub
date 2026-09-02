const express = require("express");
const categoryController = require("../../controllers/category.controller");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate");
const {
  createCategoryValidator,
  updateCategoryValidator,
  categoryIdValidator,
} = require("../../validators/category.validator");

const router = express.Router();

// --- Public ---
router.get("/", categoryController.listPublicCategories);

// --- Admin only ---
router.get("/admin/all", authenticate, authorize("admin"), categoryController.listAllCategories);
router.post(
  "/",
  authenticate,
  authorize("admin"),
  createCategoryValidator,
  validate,
  categoryController.createCategory
);
router.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  updateCategoryValidator,
  validate,
  categoryController.updateCategory
);
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  categoryIdValidator,
  validate,
  categoryController.deactivateCategory
);

module.exports = router;
