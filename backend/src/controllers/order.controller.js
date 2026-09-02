const catchAsync = require("../utils/catchAsync");
const ApiResponse = require("../utils/ApiResponse");
const orderService = require("../services/order.service");

const createOrder = catchAsync(async (req, res) => {
  const order = await orderService.createOrder(req.user.id, req.body);
  res.status(201).json(new ApiResponse("Order placed successfully", order));
});

const getMyOrders = catchAsync(async (req, res) => {
  const { orders, pagination } = await orderService.getMyOrders(req.user.id, req.query);
  res.status(200).json({ success: true, message: "Orders fetched successfully", data: orders, pagination });
});

const getMyOrderById = catchAsync(async (req, res) => {
  const order = await orderService.getMyOrderById(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse("Order fetched successfully", order));
});

const cancelOrder = catchAsync(async (req, res) => {
  const order = await orderService.cancelOrder(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse("Order cancelled successfully", order));
});

const adminGetAllOrders = catchAsync(async (req, res) => {
  const { orders, pagination } = await orderService.adminGetAllOrders(req.query);
  res.status(200).json({ success: true, message: "Orders fetched successfully", data: orders, pagination });
});

const adminGetOrderById = catchAsync(async (req, res) => {
  const order = await orderService.adminGetOrderById(req.params.id);
  res.status(200).json(new ApiResponse("Order fetched successfully", order));
});

const adminUpdateOrderStatus = catchAsync(async (req, res) => {
  const order = await orderService.adminUpdateOrderStatus(req.params.id, req.body.status);
  res.status(200).json(new ApiResponse("Order status updated successfully", order));
});

module.exports = {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelOrder,
  adminGetAllOrders,
  adminGetOrderById,
  adminUpdateOrderStatus,
};
