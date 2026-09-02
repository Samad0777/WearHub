const Category = require("../models/Category");
const ApiError = require("../utils/ApiError");
const slugify = require("../utils/slugify");

async function createCategory({ name, description }) {
  const slug = slugify(name);

  const existing = await Category.findOne({ slug });
  if (existing) {
    throw new ApiError(409, "A category with this name already exists");
  }

  return Category.create({ name, slug, description });
}

async function listCategories({ includeInactive = false } = {}) {
  const filter = includeInactive ? {} : { isActive: true };
  return Category.find(filter).sort({ name: 1 });
}

async function getCategoryById(id) {
  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }
  return category;
}

async function updateCategory(id, updates) {
  const category = await getCategoryById(id);

  if (updates.name) {
    updates.slug = slugify(updates.name);
    const existing = await Category.findOne({ slug: updates.slug, _id: { $ne: id } });
    if (existing) {
      throw new ApiError(409, "A category with this name already exists");
    }
  }

  Object.assign(category, updates);
  await category.save();
  return category;
}

// Deactivate rather than hard-delete — products reference categories, and
// hard-deleting one would either orphan them or require a cascading
// delete. Deactivating keeps history intact and is reversible.
async function deactivateCategory(id) {
  const category = await getCategoryById(id);
  category.isActive = false;
  await category.save();
  return category;
}

module.exports = {
  createCategory,
  listCategories,
  getCategoryById,
  updateCategory,
  deactivateCategory,
};
