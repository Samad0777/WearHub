const catchAsync = require("../utils/catchAsync");
const ApiResponse = require("../utils/ApiResponse");
const wishlistService = require("../services/wishlist.service");

const getWishlist = catchAsync(async (req, res) => {
  const wishlist = await wishlistService.getWishlist(req.user.id);
  res.status(200).json(new ApiResponse("Wishlist fetched successfully", wishlist));
});

const addItem = catchAsync(async (req, res) => {
  const wishlist = await wishlistService.addItem(req.user.id, req.body.productId);
  res.status(200).json(new ApiResponse("Product added to wishlist", wishlist));
});

const removeItem = catchAsync(async (req, res) => {
  const wishlist = await wishlistService.removeItem(req.user.id, req.params.productId);
  res.status(200).json(new ApiResponse("Product removed from wishlist", wishlist));
});

module.exports = { getWishlist, addItem, removeItem };
