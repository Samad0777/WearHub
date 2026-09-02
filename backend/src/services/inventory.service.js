const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");

// Reduces stock for every item in an order, atomically, inside a Mongo
// transaction (the caller provides the session). Two things make this
// safe under concurrency:
//
// 1. Each individual update is itself atomic: the filter checks
//    `variants.stock: { $gte: quantity }` in the SAME operation that
//    decrements it, so two simultaneous requests can't both read
//    "5 in stock" and both proceed — MongoDB serializes the two $inc
//    operations, so the second one's filter will no longer match once
//    the first has already taken the stock below the requested amount.
// 2. Wrapping all item updates in one transaction means if ANY item in
//    a multi-item order fails (e.g. item 3 of 3 is out of stock), the
//    stock already deducted for items 1 and 2 is rolled back — an order
//    is all-or-nothing, never partially reserved.
async function reduceStockForOrder(items, session) {
  for (const item of items) {
    const result = await Product.updateOne(
      { _id: item.product, "variants._id": item.variantId, "variants.stock": { $gte: item.quantity } },
      { $inc: { "variants.$.stock": -item.quantity } },
      { session }
    );

    if (result.matchedCount === 0) {
      throw new ApiError(409, `Insufficient stock for "${item.name}" — someone may have just bought the last units`);
    }
  }
}

// Restores stock — used on order cancellation. No stock-sufficiency
// check needed here (we're only ever adding back), but still wrapped in
// the same transaction as the order-status update by the caller so a
// failure midway doesn't leave stock restored without the order actually
// being marked cancelled (or vice versa).
async function restoreStockForOrder(items, session) {
  for (const item of items) {
    await Product.updateOne(
      { _id: item.product, "variants._id": item.variantId },
      { $inc: { "variants.$.stock": item.quantity } },
      { session }
    );
  }
}

module.exports = { reduceStockForOrder, restoreStockForOrder };
