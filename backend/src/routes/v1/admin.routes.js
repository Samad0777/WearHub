const express = require("express");
const adminController = require("../../controllers/admin.controller");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate");
const { param, query } = require("express-validator");

const router = express.Router();

// Every route in this file is admin-only.
router.use(authenticate, authorize("admin"));

router.get("/dashboard", adminController.getDashboardStats);
router.get(
  "/customers",
  [query("page").optional().isInt({ min: 1 }), query("limit").optional().isInt({ min: 1, max: 100 })],
  validate,
  adminController.listCustomers
);
router.get(
  "/customers/:id",
  [param("id").isMongoId().withMessage("Invalid customer id")],
  validate,
  adminController.getCustomerById
);

module.exports = router;
