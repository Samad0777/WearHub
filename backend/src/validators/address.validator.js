const { body, param } = require("express-validator");

const createAddressValidator = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("phone").trim().notEmpty().withMessage("Phone number is required"),
  body("addressLine").trim().notEmpty().withMessage("Address line is required"),
  body("city").trim().notEmpty().withMessage("City is required"),
  body("state").trim().notEmpty().withMessage("State is required"),
  body("postalCode").trim().notEmpty().withMessage("Postal code is required"),
  body("country").optional().trim(),
  body("isDefault").optional().isBoolean().withMessage("isDefault must be a boolean"),
];

const updateAddressValidator = [
  param("id").isMongoId().withMessage("Invalid address id"),
  body("fullName").optional().trim().notEmpty(),
  body("phone").optional().trim().notEmpty(),
  body("addressLine").optional().trim().notEmpty(),
  body("city").optional().trim().notEmpty(),
  body("state").optional().trim().notEmpty(),
  body("postalCode").optional().trim().notEmpty(),
  body("isDefault").optional().isBoolean().withMessage("isDefault must be a boolean"),
];

const addressIdValidator = [param("id").isMongoId().withMessage("Invalid address id")];

module.exports = { createAddressValidator, updateAddressValidator, addressIdValidator };
