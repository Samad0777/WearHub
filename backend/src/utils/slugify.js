// Small hand-rolled slugify — good enough for product/category names and
// avoids pulling in a whole library for one function.
function slugify(text) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // strip anything that isn't a word char, space, or hyphen
    .replace(/[\s_]+/g, "-") // spaces/underscores -> hyphen
    .replace(/-+/g, "-"); // collapse repeated hyphens
}

module.exports = slugify;
