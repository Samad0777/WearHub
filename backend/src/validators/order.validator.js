const { body, param, query } = require("express-validator");

const createOrderValidator = [
  body("addressId").isMongoId().withMessage("A valid addressId is required"),
  body("couponCode").optional().trim(),
];

const orderIdValidator = [param("id").isMongoId().withMessage("Invalid order id")];

const listOrdersValidator = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
];

const updateOrderStatusValidator = [
  param("id").isMongoId().withMessage("Invalid order id"),
  body("status")
    .isIn(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"])
    .withMessage("Invalid order status"),
];

module.exports = { createOrderValidator, orderIdValidator, listOrdersValidator, updateOrderStatusValidator };
