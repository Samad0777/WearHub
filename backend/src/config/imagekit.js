const ImageKit = require("imagekit");

// Single shared ImageKit client. Images are never stored in MongoDB —
// only the resulting URL + fileId are, once ImageKit has hosted the file.
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

module.exports = imagekit;
