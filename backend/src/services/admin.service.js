const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");
const { parsePagination, buildPaginationMeta } = require("../utils/pagination");

async function getDashboardStats() {
  const [totalOrders, revenueResult, totalCustomers, totalActiveProducts, ordersByStatusRaw] = await Promise.all([
    Order.countDocuments(),
    // Revenue only counts orders that were actually paid — a pending or
    // cancelled order never contributed real money.
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$pricing.total" } } },
    ]),
    User.countDocuments({ role: "customer" }),
    Product.countDocuments({ isActive: true }),
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  const ordersByStatus = Object.fromEntries(ordersByStatusRaw.map((entry) => [entry._id, entry.count]));

  return {
    totalOrders,
    totalRevenue: revenueResult[0]?.total || 0,
    totalCustomers,
    totalActiveProducts,
    ordersByStatus,
  };
}

// Only safe, non-sensitive fields are ever selected here — no password,
// no internal auth details — this endpoint is for admin visibility into
// the customer base, not a full account dump.
async function listCustomers(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { role: "customer" };

  const [customers, total] = await Promise.all([
    User.find(filter).select("name email emailVerified createdAt").sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return { customers, pagination: buildPaginationMeta(page, limit, total) };
}

async function getCustomerById(id) {
  const customer = await User.findOne({ _id: id, role: "customer" }).select("name email emailVerified createdAt");
  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }
  return customer;
}

module.exports = { getDashboardStats, listCustomers, getCustomerById };
