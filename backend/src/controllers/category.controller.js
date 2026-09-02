const catchAsync = require("../utils/catchAsync");
const ApiResponse = require("../utils/ApiResponse");
const categoryService = require("../services/category.service");

const createCategory = catchAsync(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  res.status(201).json(new ApiResponse("Category created successfully", category));
});

// Public endpoint — always active-only, regardless of who's asking.
const listPublicCategories = catchAsync(async (req, res) => {
  const categories = await categoryService.listCategories({ includeInactive: false });
  res.status(200).json(new ApiResponse("Categories fetched successfully", categories));
});

// Admin endpoint — sees inactive categories too, for management purposes.
const listAllCategories = catchAsync(async (req, res) => {
  const categories = await categoryService.listCategories({ includeInactive: true });
  res.status(200).json(new ApiResponse("Categories fetched successfully", categories));
});

const updateCategory = catchAsync(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  res.status(200).json(new ApiResponse("Category updated successfully", category));
});

const deactivateCategory = catchAsync(async (req, res) => {
  await categoryService.deactivateCategory(req.params.id);
  res.status(200).json(new ApiResponse("Category deactivated successfully"));
});

module.exports = {
  createCategory,
  listPublicCategories,
  listAllCategories,
  updateCategory,
  deactivateCategory,
};
