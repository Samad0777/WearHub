const mongoose = require("mongoose");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Address = require("../models/Address");
const Coupon = require("../models/Coupon");
const ApiError = require("../utils/ApiError");
const { parsePagination, buildPaginationMeta } = require("../utils/pagination");
const inventoryService = require("./inventory.service");
const couponService = require("./coupon.service");

// Orders that have NOT progressed past these statuses can still be
// cancelled by the customer. Once shipped/delivered/already-cancelled,
// cancellation is no longer allowed via this endpoint.
const CANCELLABLE_STATUSES = ["pending", "confirmed"];

// --- Create order (checkout) ---
//
// UPDATED IN PHASE 6: Razorpay is now wired up, so this no longer
// deducts stock at order-creation time (that was a temporary stand-in
// used in Phase 5, before payments existed). Now: this only VALIDATES
// stock is currently sufficient and creates the order with
// paymentStatus "pending" — actual stock deduction happens in
// payment.service.js's confirmPayment(), inside the same transaction
// that marks the order paid. This keeps inventory changes and money
// changes atomic together, instead of stock being reserved before a
// customer has even attempted payment.
async function createOrder(userId, { addressId, couponCode }) {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Your cart is empty");
  }

  // Re-validate + snapshot every item against LIVE product data — same
  // "backend is authoritative" principle as the cart. We do NOT trust
  // any price the frontend might have shown the user a moment ago.
  const orderItems = [];
  let subtotal = 0;

  for (const cartItem of cart.items) {
    const product = await Product.findById(cartItem.product);
    if (!product || !product.isActive) {
      throw new ApiError(400, `A product in your cart is no longer available`);
    }

    const variant = product.variants.id(cartItem.variantId);
    if (!variant || !variant.isActive) {
      throw new ApiError(400, `A variant of "${product.name}" is no longer available`);
    }
    if (variant.stock < cartItem.quantity) {
      throw new ApiError(400, `Only ${variant.stock} unit(s) of "${product.name}" left in stock`);
    }

    subtotal += variant.price * cartItem.quantity;

    orderItems.push({
      product: product._id,
      variantId: variant._id,
      name: product.name,
      sku: variant.sku,
      image: product.images[0]?.url,
      quantity: cartItem.quantity,
      unitPrice: variant.price,
    });
  }

  let discount = 0;
  let appliedCoupon = null;
  if (couponCode) {
    const result = await couponService.validateAndCalculateDiscount(couponCode, subtotal);
    discount = result.discount;
    appliedCoupon = result.coupon;
  }

  const total = subtotal - discount;

  const shippingAddressSnapshot = {
    fullName: address.fullName,
    phone: address.phone,
    addressLine: address.addressLine,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
  };

  // No stock deduction here anymore — just create the order + bump the
  // coupon's usage count, atomically (so a crash between the two never
  // leaves a coupon "used" with no order to show for it).
  const session = await mongoose.startSession();
  let createdOrder;
  try {
    await session.withTransaction(async () => {
      const [order] = await Order.create(
        [
          {
            user: userId,
            items: orderItems,
            shippingAddressSnapshot,
            pricing: { subtotal, discount, total },
            coupon: appliedCoupon ? appliedCoupon._id : undefined,
            status: "pending",
            paymentStatus: "pending",
          },
        ],
        { session }
      );
      createdOrder = order;

      if (appliedCoupon) {
        await Coupon.updateOne({ _id: appliedCoupon._id }, { $inc: { usedCount: 1 } }, { session });
      }
    });
  } finally {
    await session.endSession();
  }

  // Clear the cart only after the order is safely committed. The cart
  // will need re-adding if payment fails and the customer wants to
  // retry with different items — acceptable trade-off; the order itself
  // can still be paid via a fresh Razorpay attempt using the same order.
  cart.items = [];
  await cart.save();

  return createdOrder;
}

// --- Customer: list own orders (paginated) ---
async function getMyOrders(userId, query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { user: userId };

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  return { orders, pagination: buildPaginationMeta(page, limit, total) };
}

async function getMyOrderById(userId, orderId) {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  return order;
}

// --- Customer: cancel an eligible order ---
async function cancelOrder(userId, orderId) {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    throw new ApiError(400, `An order that is already "${order.status}" cannot be cancelled`);
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Stock is only ever deducted once a payment is confirmed (see
      // payment.service.js). An order that's still "pending" (unpaid)
      // never had its stock touched, so there's nothing to restore for
      // it — only a "paid" order needs stock restored on cancellation.
      if (order.paymentStatus === "paid" && !order.isStockRestored) {
        await inventoryService.restoreStockForOrder(order.items, session);
        order.isStockRestored = true;
      }
      order.status = "cancelled";
      await order.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return order;
}

// --- Admin ---
async function adminGetAllOrders(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter).populate("user", "name email").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  return { orders, pagination: buildPaginationMeta(page, limit, total) };
}

async function adminGetOrderById(orderId) {
  const order = await Order.findById(orderId).populate("user", "name email");
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  return order;
}

const VALID_FORWARD_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

async function adminUpdateOrderStatus(orderId, newStatus) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const allowedNext = VALID_FORWARD_TRANSITIONS[order.status] || [];
  if (!allowedNext.includes(newStatus)) {
    throw new ApiError(400, `Cannot move an order from "${order.status}" to "${newStatus}"`);
  }

  // If an admin cancels an order that was already paid (and therefore had
  // stock deducted), restore it the same way customer cancellation does.
  if (newStatus === "cancelled" && order.paymentStatus === "paid" && !order.isStockRestored) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await inventoryService.restoreStockForOrder(order.items, session);
        order.isStockRestored = true;
        order.status = newStatus;
        await order.save({ session });
      });
    } finally {
      await session.endSession();
    }
  } else {
    order.status = newStatus;
    await order.save();
  }

  return order;
}

module.exports = {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelOrder,
  adminGetAllOrders,
  adminGetOrderById,
  adminUpdateOrderStatus,
};
