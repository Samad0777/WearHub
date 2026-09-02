const express = require("express");
const orderController = require("../../controllers/order.controller");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate");
const {
  createOrderValidator,
  orderIdValidator,
  listOrdersValidator,
  updateOrderStatusValidator,
} = require("../../validators/order.validator");

const router = express.Router();

router.use(authenticate);

// --- Customer ---
router.post("/", createOrderValidator, validate, orderController.createOrder);
router.get("/my-orders", listOrdersValidator, validate, orderController.getMyOrders);
router.get("/my-orders/:id", orderIdValidator, validate, orderController.getMyOrderById);
router.post("/:id/cancel", orderIdValidator, validate, orderController.cancelOrder);

// --- Admin ---
router.get("/admin/all", authorize("admin"), listOrdersValidator, validate, orderController.adminGetAllOrders);
router.get("/admin/:id", authorize("admin"), orderIdValidator, validate, orderController.adminGetOrderById);
router.patch(
  "/admin/:id/status",
  authorize("admin"),
  updateOrderStatusValidator,
  validate,
  orderController.adminUpdateOrderStatus
);

module.exports = router;
