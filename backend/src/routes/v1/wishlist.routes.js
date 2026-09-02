const express = require("express");
const wishlistController = require("../../controllers/wishlist.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate");
const { addItemValidator, productIdParamValidator } = require("../../validators/wishlist.validator");

const router = express.Router();

router.use(authenticate);

router.get("/", wishlistController.getWishlist);
router.post("/items", addItemValidator, validate, wishlistController.addItem);
router.delete("/items/:productId", productIdParamValidator, validate, wishlistController.removeItem);

module.exports = router;
