const express = require("express");
const addressController = require("../../controllers/address.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate");
const {
  createAddressValidator,
  updateAddressValidator,
  addressIdValidator,
} = require("../../validators/address.validator");

const router = express.Router();

router.use(authenticate);

router.get("/", addressController.listAddresses);
router.post("/", createAddressValidator, validate, addressController.createAddress);
router.patch("/:id", updateAddressValidator, validate, addressController.updateAddress);
router.delete("/:id", addressIdValidator, validate, addressController.deleteAddress);
router.patch("/:id/default", addressIdValidator, validate, addressController.setDefaultAddress);

module.exports = router;
