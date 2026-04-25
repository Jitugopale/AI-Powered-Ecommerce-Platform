import { prisma } from "../services/prisma.js";

export const addAddressController = async (req, res) => {
  const { addressline, state, city, pincode } = req.body;

  if (!addressline || !state || !city || !pincode) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }
  try {
    const userId = req.user.id;
    const address = await prisma.address.create({
      data: {
        addressline,
        state,
        city,
        pincode,
        userId: userId,
      },
    });

    return res.status(201).json({
      message: "Address added Successfully",
      data: address,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to add address" });
  }
};

export const updateAddressController = async (req, res) => {
  const userId = Number(req.user.id);
  const addressId = Number(req.params.addressId);

  const { addressline, state, city, pincode } = req.body;

  if (isNaN(addressId)) {
    return res.status(400).json({
      message: "Invalid addressId",
    });
  }

  if (!addressline && !state && !city && !pincode) {
    return res.status(400).json({
      message: "At least one field is required",
    });
  }
  try {
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: userId,
      },
    });

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    const updateData = {};
    if (addressline) updateData.addressline = addressline;
    if (state) updateData.state = state;
    if (city) updateData.city = city;
    if (pincode) updateData.pincode = pincode;

    const updatedData = await prisma.address.update({
      where: {
        id: addressId,
      },
      data: updateData,
    });

    return res.status(200).json({
      message: "Address updated Successfully",
      data: updatedData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update address" });
  }
};

export const deleteAddressController = async (req, res) => {
  const userId = Number(req.user.id);
  const addressId = Number(req.params.addressId);

  if (isNaN(addressId)) {
    return res.status(400).json({
      message: "Invalid addressId",
    });
  }

  try {
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: userId,
      },
    });

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    const deleteAddress = await prisma.address.delete({
      where: {
        id: addressId,
      },
    });

    return res.status(200).json({
      message: "Address deleted Successfully",
      data: deleteAddress,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete address" });
  }
};

export const getMyAddressesController = async (req, res) => {
  const userId = Number(req.user.id);
  try {
    const addresses = await prisma.address.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Fetched All adresses successfully",
      data: addresses,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to getAll address",
    });
  }
};
