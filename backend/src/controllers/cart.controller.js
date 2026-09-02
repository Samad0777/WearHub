const catchAsync = require("../utils/catchAsync");
const ApiResponse = require("../utils/ApiResponse");
const cartService = require("../services/cart.service");

const getCart = catchAsync(async (req, res) => {
  const cart = await cartService.getCart(req.user.id);
  res.status(200).json(new ApiResponse("Cart fetched successfully", cart));
});

const addItem = catchAsync(async (req, res) => {
  const cart = await cartService.addItem(req.user.id, req.body);
  res.status(200).json(new ApiResponse("Item added to cart", cart));
});

const updateItemQuantity = catchAsync(async (req, res) => {
  const cart = await cartService.updateItemQuantity(req.user.id, req.params.itemId, req.body.quantity);
  res.status(200).json(new ApiResponse("Cart item updated", cart));
});

const removeItem = catchAsync(async (req, res) => {
  const cart = await cartService.removeItem(req.user.id, req.params.itemId);
  res.status(200).json(new ApiResponse("Item removed from cart", cart));
});

const clearCart = catchAsync(async (req, res) => {
  const cart = await cartService.clearCart(req.user.id);
  res.status(200).json(new ApiResponse("Cart cleared", cart));
});

module.exports = { getCart, addItem, updateItemQuantity, removeItem, clearCart };
