const catchAsync = require("../utils/catchAsync");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const productService = require("../services/product.service");

const createProduct = catchAsync(async (req, res) => {
  const imageFiles = req.files || []; // populated by multer's uploadProductImages when images were sent

  // At least one image is required. A product with zero photos isn't
  // something a real store should ever have live — better to reject the
  // create outright than let an unsellable product slip through, since
  // "add an image later" is easy to forget once the product exists.
  if (imageFiles.length === 0) {
    throw new ApiError(400, "At least one product image is required");
  }

  const { product, failedUploads } = await productService.createProduct(req.body, imageFiles);

  const message =
    failedUploads.length > 0
      ? `Product created, but ${failedUploads.length} image(s) failed to upload: ${failedUploads.join(", ")}. You can add them separately.`
      : "Product created successfully";

  res.status(201).json(new ApiResponse(message, product));
});

const listProducts = catchAsync(async (req, res) => {
  const { products, pagination } = await productService.listProducts(req.query);
  res.status(200).json({
    success: true,
    message: "Products fetched successfully",
    data: products,
    pagination,
  });
});

const getProductBySlug = catchAsync(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug);
  res.status(200).json(new ApiResponse("Product fetched successfully", product));
});

const updateProduct = catchAsync(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.status(200).json(new ApiResponse("Product updated successfully", product));
});

const deactivateProduct = catchAsync(async (req, res) => {
  await productService.deactivateProduct(req.params.id);
  res.status(200).json(new ApiResponse("Product deactivated successfully"));
});

const addProductImage = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "An image file is required");
  }
  const product = await productService.addProductImage(req.params.id, req.file.buffer, req.file.originalname);
  res.status(200).json(new ApiResponse("Image uploaded successfully", product));
});

const removeProductImage = catchAsync(async (req, res) => {
  const product = await productService.removeProductImage(req.params.id, req.params.imageId);
  res.status(200).json(new ApiResponse("Image removed successfully", product));
});

module.exports = {
  createProduct,
  listProducts,
  getProductBySlug,
  updateProduct,
  deactivateProduct,
  addProductImage,
  removeProductImage,
};
