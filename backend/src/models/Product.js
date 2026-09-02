const mongoose = require("mongoose");

// Variants are embedded (not a separate collection) because they have no
// independent lifecycle — a variant only ever exists as part of its
// product, and is always read/written together with it.
const variantSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, "SKU is required"],
      trim: true,
      uppercase: true,
    },
    // A flexible key-value map instead of hardcoded size/color fields, so
    // this same schema works for a T-shirt (size, color), a phone
    // (storage, color), or a chair (material) without any code change.
    attributes: {
      type: Map,
      of: String,
      default: {},
    },
    price: {
      type: Number,
      required: [true, "Variant price is required"],
      min: [0, "Price cannot be negative"],
    },
    compareAtPrice: {
      type: Number,
      min: [0, "Compare-at price cannot be negative"],
    },
    stock: {
      type: Number,
      required: true,
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true } // each variant keeps its own _id — used as a stable reference from Cart/Order items
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    images: [
      {
        url: { type: String, required: true },
        fileId: { type: String, required: true }, // ImageKit's file id, needed to delete the image later
      },
    ],
    variants: {
      type: [variantSchema],
      validate: {
        validator: (variants) => variants.length > 0,
        message: "A product must have at least one variant",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    ratingAvg: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

productSchema.index({ "variants.sku": 1 }, { unique: true });
productSchema.index({ category: 1, isActive: 1 });
// Text index powers the $text search used in listProducts (services/product.service.js)
productSchema.index({ name: "text", description: "text" });

// A product's own price range is derived from its variants — convenient
// for cards/listings that show "from ₹X" without loading every variant.
productSchema.virtual("minPrice").get(function () {
  if (!this.variants || this.variants.length === 0) return null;
  return Math.min(...this.variants.map((v) => v.price));
});
productSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);
