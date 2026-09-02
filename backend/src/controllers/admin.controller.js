const catchAsync = require("../utils/catchAsync");
const ApiResponse = require("../utils/ApiResponse");
const adminService = require("../services/admin.service");

const getDashboardStats = catchAsync(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  res.status(200).json(new ApiResponse("Dashboard stats fetched successfully", stats));
});

const listCustomers = catchAsync(async (req, res) => {
  const { customers, pagination } = await adminService.listCustomers(req.query);
  res.status(200).json({ success: true, message: "Customers fetched successfully", data: customers, pagination });
});

const getCustomerById = catchAsync(async (req, res) => {
  const customer = await adminService.getCustomerById(req.params.id);
  res.status(200).json(new ApiResponse("Customer fetched successfully", customer));
});

module.exports = { getDashboardStats, listCustomers, getCustomerById };
