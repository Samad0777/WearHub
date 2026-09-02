const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");

async function getOrCreateWishlist(userId) {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, items: [] });
  }
  return wishlist;
}

async function getWishlist(userId) {
  const wishlist = await getOrCreateWishlist(userId);
  await wishlist.populate("items.product", "name slug images isActive");
  return wishlist;
}

async function addItem(userId, productId) {
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new ApiError(404, "Product not found or is no longer available");
  }

  const wishlist = await getOrCreateWishlist(userId);

  const alreadyExists = wishlist.items.some((item) => item.product.toString() === productId);
  if (alreadyExists) {
    throw new ApiError(409, "Product is already in your wishlist");
  }

  wishlist.items.push({ product: productId });
  await wishlist.save();
  return wishlist;
}

async function removeItem(userId, productId) {
  const wishlist = await getOrCreateWishlist(userId);
  wishlist.items = wishlist.items.filter((item) => item.product.toString() !== productId);
  await wishlist.save();
  return wishlist;
}

module.exports = { getWishlist, addItem, removeItem };
