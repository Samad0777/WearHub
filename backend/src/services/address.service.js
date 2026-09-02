const Address = require("../models/Address");
const ApiError = require("../utils/ApiError");

async function listAddresses(userId) {
  return Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
}

async function getOwnAddress(userId, addressId) {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    // Same 404 whether the address doesn't exist or belongs to someone
    // else — never reveal that a different user's address id is valid.
    throw new ApiError(404, "Address not found");
  }
  return address;
}

async function createAddress(userId, data) {
  const isFirstAddress = (await Address.countDocuments({ user: userId })) === 0;

  // The very first address a user adds automatically becomes their
  // default, so checkout always has one to fall back to.
  const isDefault = isFirstAddress ? true : Boolean(data.isDefault);

  if (isDefault) {
    await Address.updateMany({ user: userId }, { isDefault: false });
  }

  return Address.create({ ...data, user: userId, isDefault });
}

async function updateAddress(userId, addressId, updates) {
  const address = await getOwnAddress(userId, addressId);

  if (updates.isDefault === true) {
    await Address.updateMany({ user: userId, _id: { $ne: addressId } }, { isDefault: false });
  }

  Object.assign(address, updates);
  await address.save();
  return address;
}

async function deleteAddress(userId, addressId) {
  const address = await getOwnAddress(userId, addressId);
  await address.deleteOne();

  // If the deleted address was the default, promote the most recently
  // created remaining address so checkout still has a default to use.
  if (address.isDefault) {
    const nextAddress = await Address.findOne({ user: userId }).sort({ createdAt: -1 });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }
}

async function setDefaultAddress(userId, addressId) {
  await getOwnAddress(userId, addressId); // ensures ownership + existence
  await Address.updateMany({ user: userId }, { isDefault: false });
  return Address.findByIdAndUpdate(addressId, { isDefault: true }, { new: true });
}

module.exports = { listAddresses, getOwnAddress, createAddress, updateAddress, deleteAddress, setDefaultAddress };
