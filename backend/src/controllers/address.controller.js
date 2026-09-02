const catchAsync = require("../utils/catchAsync");
const ApiResponse = require("../utils/ApiResponse");
const addressService = require("../services/address.service");

const listAddresses = catchAsync(async (req, res) => {
  const addresses = await addressService.listAddresses(req.user.id);
  res.status(200).json(new ApiResponse("Addresses fetched successfully", addresses));
});

const createAddress = catchAsync(async (req, res) => {
  const address = await addressService.createAddress(req.user.id, req.body);
  res.status(201).json(new ApiResponse("Address added successfully", address));
});

const updateAddress = catchAsync(async (req, res) => {
  const address = await addressService.updateAddress(req.user.id, req.params.id, req.body);
  res.status(200).json(new ApiResponse("Address updated successfully", address));
});

const deleteAddress = catchAsync(async (req, res) => {
  await addressService.deleteAddress(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse("Address deleted successfully"));
});

const setDefaultAddress = catchAsync(async (req, res) => {
  const address = await addressService.setDefaultAddress(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse("Default address updated", address));
});

module.exports = { listAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress };
