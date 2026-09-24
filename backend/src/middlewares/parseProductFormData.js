const ApiError = require("../utils/ApiError");

// multipart/form-data (needed for file uploads) sends every text field as
// a plain string — including `variants`, which is actually a JSON array
// of objects. This parses it back into a real array before validation
// runs, so the rest of the app treats `variants` exactly like it always
// did on the old JSON-only endpoint. If the request was sent as plain
// JSON instead (no images), `req.body.variants` is already an array —
// this middleware simply does nothing in that case.
function parseProductFormData(req, res, next) {
  if (typeof req.body.variants === "string") {
    try {
      req.body.variants = JSON.parse(req.body.variants);
    } catch (err) {
      return next(new ApiError(400, "variants must be valid JSON — check your frontend is JSON.stringify-ing it"));
    }
  }
  next();
}

module.exports = parseProductFormData;
