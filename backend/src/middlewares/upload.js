const multer = require("multer");
const ApiError = require("../utils/ApiError");

// Memory storage — the file stays in a Buffer in memory just long enough
// to hand off to ImageKit; we never write uploads to disk.
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new ApiError(400, "Only JPEG, PNG, and WEBP images are allowed"));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per image
});

// Used by product CREATE, where the admin can attach several images
// (product photos, not per-variant) in the same request as the product
// data — field name must be "images" on the frontend's FormData.
const uploadProductImages = upload.array("images", 6);

module.exports = upload;
module.exports.uploadProductImages = uploadProductImages;
