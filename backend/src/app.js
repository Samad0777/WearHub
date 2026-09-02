const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const errorHandler = require("./middlewares/errorHandler");
const { generalLimiter } = require("./middlewares/rateLimiter");
const ApiError = require("./utils/ApiError");

const app = express();

// --- Security & core middleware ---
app.use(helmet()); // sets a bunch of safe HTTP headers (no config needed for now)
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true, // required so the browser sends/receives the refresh-token cookie
  })
);
app.use(express.json({
  limit: "10kb",
  // Razorpay signs the RAW request body bytes for webhooks — if we only
  // kept the parsed object, re-serializing it to verify the signature
  // could produce different bytes (key order, spacing) and always fail.
  // This stashes the untouched raw buffer alongside the normal parsed
  // req.body, at negligible cost, for every request.
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
})); // caps request body size
app.use(cookieParser());
app.use(generalLimiter);

// --- Health check (useful for deployment platforms + quick sanity test) ---
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is healthy" });
});

// --- API routes ---
app.use("/api/v1/auth", require("./routes/v1/auth.routes"));
app.use("/api/v1/categories", require("./routes/v1/category.routes"));
app.use("/api/v1/products", require("./routes/v1/product.routes"));
app.use("/api/v1/cart", require("./routes/v1/cart.routes"));
app.use("/api/v1/wishlist", require("./routes/v1/wishlist.routes"));
app.use("/api/v1/addresses", require("./routes/v1/address.routes"));
app.use("/api/v1/coupons", require("./routes/v1/coupon.routes"));
app.use("/api/v1/orders", require("./routes/v1/order.routes"));
app.use("/api/v1/payments", require("./routes/v1/payment.routes"));
app.use("/api/v1/reviews", require("./routes/v1/review.routes"));
app.use("/api/v1/admin", require("./routes/v1/admin.routes"));

// --- Unknown route handler ---
app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// --- Centralized error handler (must be last) ---
app.use(errorHandler);

module.exports = app;
