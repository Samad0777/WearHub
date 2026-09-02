const imagekit = require("../config/imagekit");
const ApiError = require("../utils/ApiError");

// Uploads a file buffer (from multer's memory storage) to ImageKit and
// returns just what we need to store: the public URL and the fileId
// (fileId is required later if we ever want to delete the image).
async function uploadProductImage(fileBuffer, fileName) {
  try {
    const result = await imagekit.upload({
      file: fileBuffer,
      fileName,
      folder: "/products",
    });
    return { url: result.url, fileId: result.fileId };
  } catch (error) {
    throw new ApiError(502, "Image upload failed, please try again");
  }
}

async function deleteProductImage(fileId) {
  try {
    await imagekit.deleteFile(fileId);
  } catch (error) {
    // Non-fatal — if ImageKit's delete fails (e.g. already deleted), we
    // don't want that to block removing the reference from our own DB.
    console.error("ImageKit delete failed:", error.message);
  }
}

module.exports = { uploadProductImage, deleteProductImage };
