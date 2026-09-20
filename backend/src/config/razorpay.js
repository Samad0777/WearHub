const Razorpay = require("razorpay");

// Lazily constructed. Requiring this module happens as a side-effect of
// app.js loading every route file at startup (auth, products, cart...)
// — but most of those requests never touch payments. If we built the
// client eagerly here, simply starting the app (or running a test suite
// for an unrelated feature) would crash with Razorpay's "key_id is
// mandatory" error whenever RAZORPAY_KEY_ID/SECRET aren't set — which
// is true for local dev before Razorpay is configured, and true for any
// test file that doesn't need payments. The Proxy defers actually
// building the client until the first real property access (e.g.
// `razorpay.orders.create(...)` in payment.service.js), which only
// happens when a payment route is actually hit.
let instance = null;
function getInstance() {
  if (!instance) {
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return instance;
}

module.exports = new Proxy(
  {},
  {
    get(target, prop) {
      return getInstance()[prop];
    },
  }
);
