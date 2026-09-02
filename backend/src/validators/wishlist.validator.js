const { body, param } = require("express-validator");

const addItemValidator = [body("productId").isMongoId().withMessage("A valid productId is required")];

const productIdParamValidator = [param("productId").isMongoId().withMessage("Invalid product id")];

module.exports = { addItemValidator, productIdParamValidator };
