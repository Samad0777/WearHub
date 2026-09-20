const ImageKit = require("imagekit");

// Lazily constructed — same reasoning as config/razorpay.js. Requiring
// this module is a side-effect of app.js loading the product routes at
// startup, but most requests (and most test suites) never touch image
// uploads. Building the client eagerly here would crash on missing
// IMAGEKIT_PUBLIC_KEY/etc. even for code paths that never call ImageKit.
let instance = null;
function getInstance() {
  if (!instance) {
    instance = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
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
