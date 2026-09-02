const Cart = require("../models/Cart");
const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");

// Finds the variant subdocument inside a product's variants array by id.
// Centralized here since almost every cart operation needs to re-validate
// a product+variant pair before touching the cart.
function findVariant(product, variantId) {
  return product.variants.id(variantId);
}

async function validateProductAndVariant(productId, variantId, requestedQuantity) {
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new ApiError(404, "Product not found or is no longer available");
  }

  const variant = findVariant(product, variantId);
  if (!variant || !variant.isActive) {
    throw new ApiError(404, "This product variant is no longer available");
  }

  if (variant.stock < requestedQuantity) {
    throw new ApiError(400, `Only ${variant.stock} unit(s) left in stock for this variant`);
  }

  return { product, variant };
}

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}

// Rebuilds the cart response with LIVE product/variant data — this is the
// "backend is authoritative for prices" rule in practice. We never trust
// or store a price on the cart item itself; every read recalculates it
// from the current Product document, so a price change is reflected
// immediately and a stale/manipulated client-side price is impossible.
async function buildCartResponse(cart) {
  const items = [];
  let subtotal = 0;
  let hasUnavailableItems = false;

  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    const variant = product && product.isActive ? findVariant(product, item.variantId) : null;
    const isAvailable = Boolean(variant && variant.isActive && variant.stock >= item.quantity);

    if (!isAvailable) hasUnavailableItems = true;

    const lineTotal = isAvailable ? variant.price * item.quantity : 0;
    subtotal += lineTotal;

    items.push({
      itemId: item._id,
      product: product ? { id: product._id, name: product.name, slug: product.slug, images: product.images } : null,
      variantId: item.variantId,
      attributes: variant ? Object.fromEntries(variant.attributes) : null,
      quantity: item.quantity,
      unitPrice: isAvailable ? variant.price : null,
      lineTotal,
      isAvailable,
    });
  }

  return {
    cartId: cart._id,
    items,
    subtotal,
    hasUnavailableItems, // lets the frontend warn the user before checkout
  };
}

async function getCart(userId) {
  const cart = await getOrCreateCart(userId);
  return buildCartResponse(cart);
}

async function addItem(userId, { productId, variantId, quantity }) {
  const cart = await getOrCreateCart(userId);

  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId && item.variantId.toString() === variantId
  );
  const totalRequestedQuantity = (existingItem ? existingItem.quantity : 0) + quantity;

  await validateProductAndVariant(productId, variantId, totalRequestedQuantity);

  if (existingItem) {
    existingItem.quantity = totalRequestedQuantity;
  } else {
    cart.items.push({ product: productId, variantId, quantity });
  }

  await cart.save();
  return buildCartResponse(cart);
}

async function updateItemQuantity(userId, itemId, quantity) {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.id(itemId);
  if (!item) {
    throw new ApiError(404, "Cart item not found");
  }

  await validateProductAndVariant(item.product, item.variantId, quantity);

  item.quantity = quantity;
  await cart.save();
  return buildCartResponse(cart);
}

async function removeItem(userId, itemId) {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.id(itemId);
  if (!item) {
    throw new ApiError(404, "Cart item not found");
  }

  cart.items.pull(itemId);
  await cart.save();
  return buildCartResponse(cart);
}

async function clearCart(userId) {
  const cart = await getOrCreateCart(userId);
  cart.items = [];
  await cart.save();
  return buildCartResponse(cart);
}

module.exports = { getCart, addItem, updateItemQuantity, removeItem, clearCart };
