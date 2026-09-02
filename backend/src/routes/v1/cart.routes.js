const express = require("express");
const cartController = require("../../controllers/cart.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate");
const {
  addItemValidator,
  updateQuantityValidator,
  itemIdValidator,
} = require("../../validators/cart.validator");

const router = express.Router();

// All cart routes require a logged-in user — there's no "guest cart" in v1.
router.use(authenticate);

router.get("/", cartController.getCart);
router.post("/items", addItemValidator, validate, cartController.addItem);
router.patch("/items/:itemId", updateQuantityValidator, validate, cartController.updateItemQuantity);
router.delete("/items/:itemId", itemIdValidator, validate, cartController.removeItem);
router.delete("/", cartController.clearCart);

module.exports = router;
