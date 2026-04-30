import { compare, hash } from "bcrypt";
import { prisma } from "../services/prisma.js";
import jwt from "jsonwebtoken";

export const registerController = async (req, res) => {
  const { name, email, mobile_no, password } = req.body;

  if (!name || !email || !mobile_no || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const userExists = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashPassword = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        mobile_no,
        password: hashPassword,
      },
    });

    return res.status(201).json({
      message: "User Register Successfully",
      data: user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to register user",
    });
  }
};

export const loginController = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const userExists = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!userExists) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const passwordCompare = await compare(password, userExists.password);

    if (!passwordCompare) {
      return res.status(400).json({
        message: "Invalid Password",
      });
    }

    const token = jwt.sign(
      { id: userExists.id, role: userExists.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    //Renamed 'password' to 'userPassword'

    const { password: userPassword, ...safeUser } = userExists;

    return res.status(200).json({
      message: "User loggedIn Successfully",
      data: safeUser,
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to login user",
    });
  }
};

export const getProfileController = async (req, res) => {
  const userId = Number(req.user.id);
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
        email: true,
        mobile_no: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Profile fetched successfully",
      data: user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch profile",
    });
  }
};

export const updateProfileController = async (req, res) => {
  const userId = Number(req.user.id);
  const { name, mobile_no } = req.body;

  if (!name && !mobile_no) {
    return res.status(400).json({
      message: "At least one field is required",
    });
  }

  try {
    const updatedData = {};
    if (name) updatedData.name = name;
    if (mobile_no) updatedData.mobile_no = mobile_no;

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: updatedData,
      select: { 
        id: true,
        name: true,
        email: true,
        mobile_no: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      message:"Profile Updated Successfully",
      data:updatedUser
    })
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to update profile",
    });
  }
};
