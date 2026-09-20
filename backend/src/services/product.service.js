const Product = require("../models/Product");
const Category = require("../models/Category");
const ApiError = require("../utils/ApiError");
const slugify = require("../utils/slugify");
const { parsePagination, buildPaginationMeta } = require("../utils/pagination");
const { uploadProductImage, deleteProductImage } = require("./imagekit.service");

async function createProduct({ name, description, category, variants }, imageFiles = []) {
  const categoryDoc = await Category.findById(category);
  if (!categoryDoc) {
    throw new ApiError(404, "Category not found");
  }

  const slug = slugify(name);
  const existingSlug = await Product.findOne({ slug });
  if (existingSlug) {
    throw new ApiError(409, "A product with this name already exists");
  }

  // Uppercase SKUs consistently (matches the schema's `uppercase: true`)
  // before checking for duplicates, so "ts-blk-m" and "TS-BLK-M" collide.
  const skus = variants.map((v) => v.sku.toUpperCase());
  const existingSku = await Product.findOne({ "variants.sku": { $in: skus } });
  if (existingSku) {
    throw new ApiError(409, "One or more SKUs already exist");
  }

  const product = await Product.create({ name, slug, description, category, variants });

  // Images are uploaded AFTER the product exists, one by one, each in its
  // own try/catch. Deliberate choice: ImageKit is an external service we
  // don't control, and if upload #3 of 6 fails (network blip, oversized
  // file, whatever), we don't want to throw away a product that was
  // otherwise created successfully. The admin ends up with a product
  // that has fewer images than requested rather than no product at all
  // — `failedUploads` tells the caller which ones didn't make it, so the
  // frontend can show a clear "product created, but 1 image failed to
  // upload — try adding it again" message instead of silently losing it.
  const failedUploads = [];
  for (const file of imageFiles) {
    try {
      const { url, fileId } = await uploadProductImage(file.buffer, file.originalname);
      product.images.push({ url, fileId });
    } catch (err) {
      failedUploads.push(file.originalname);
    }
  }
  if (imageFiles.length > 0) {
    // Every upload failed (e.g. ImageKit was unreachable) — don't leave
    // behind a product with zero images, since the controller enforces
    // "at least one image" as a rule. Better to fail the whole creation
    // clearly than silently produce a product that violates that rule.
    if (product.images.length === 0) {
      await product.deleteOne();
      throw new ApiError(502, "All image uploads failed — product was not created. Please try again.");
    }
    await product.save();
  }

  return { product, failedUploads };
}

// --- Listing with search + filter + sort + pagination ---
// Query params supported:
//   q          - text search on name/description
//   category   - category id
//   minPrice / maxPrice - filters against variants.price
//   sort       - "price_asc" | "price_desc" | "newest" | "rating"
//   page/limit - pagination
async function listProducts(query) {
  const { page, limit, skip } = parsePagination(query);

  const filter = { isActive: true };

  if (query.q) {
    filter.$text = { $search: query.q };
  }
  if (query.category) {
    filter.category = query.category;
  }
  if (query.minPrice || query.maxPrice) {
    filter["variants.price"] = {};
    if (query.minPrice) filter["variants.price"].$gte = Number(query.minPrice);
    if (query.maxPrice) filter["variants.price"].$lte = Number(query.maxPrice);
  }

  const sortMap = {
    price_asc: { "variants.0.price": 1 },
    price_desc: { "variants.0.price": -1 },
    newest: { createdAt: -1 },
    rating: { ratingAvg: -1 },
  };
  const sort = sortMap[query.sort] || { createdAt: -1 };

  const [products, total] = await Promise.all([
    Product.find(filter).populate("category", "name slug").sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  return { products, pagination: buildPaginationMeta(page, limit, total) };
}

async function getProductBySlug(slug) {
  const product = await Product.findOne({ slug, isActive: true }).populate("category", "name slug");
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  return product;
}

async function getProductById(id) {
  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  return product;
}

async function updateProduct(id, updates) {
  const product = await getProductById(id);

  if (updates.name) {
    updates.slug = slugify(updates.name);
    const existing = await Product.findOne({ slug: updates.slug, _id: { $ne: id } });
    if (existing) {
      throw new ApiError(409, "A product with this name already exists");
    }
  }

  if (updates.category) {
    const categoryDoc = await Category.findById(updates.category);
    if (!categoryDoc) {
      throw new ApiError(404, "Category not found");
    }
  }

  // Variants are updated wholesale (replace the array) rather than
  // patched field-by-field — simpler to reason about and avoids partial-
  // update bugs where an admin forgets a field on an existing variant.
  if (updates.variants) {
    const skus = updates.variants.map((v) => v.sku.toUpperCase());
    const existingSku = await Product.findOne({
      _id: { $ne: id },
      "variants.sku": { $in: skus },
    });
    if (existingSku) {
      throw new ApiError(409, "One or more SKUs already exist on another product");
    }
  }

  Object.assign(product, updates);
  await product.save();
  return product;
}

// Deactivate rather than hard-delete — past orders reference this
// product, and hard-deleting it would break their history/snapshot.
async function deactivateProduct(id) {
  const product = await getProductById(id);
  product.isActive = false;
  await product.save();
  return product;
}

async function addProductImage(id, fileBuffer, fileName) {
  const product = await getProductById(id);
  const { url, fileId } = await uploadProductImage(fileBuffer, fileName);
  product.images.push({ url, fileId });
  await product.save();
  return product;
}

async function removeProductImage(id, imageId) {
  const product = await getProductById(id);
  const image = product.images.id(imageId);
  if (!image) {
    throw new ApiError(404, "Image not found on this product");
  }

  await deleteProductImage(image.fileId);
  product.images.pull(imageId);
  await product.save();
  return product;
}

module.exports = {
  createProduct,
  listProducts,
  getProductBySlug,
  getProductById,
  updateProduct,
  deactivateProduct,
  addProductImage,
  removeProductImage,
};
