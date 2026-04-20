import { prisma } from "../services/prisma.js";

export const addProductController = async (req, res) => {
  const { name, description, price, brand, categoryId } = req.body;

  if (!name || !description || !price || !brand || !categoryId) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        brand,
        categoryId,
        is_active: true,
        inventory: {
          //nested relation //inventory - the relation field name
          create: {
            quantity: 0,
          },
        },
      },
      include: {
        inventory: true,
      },
    });

    return res.status(201).json({
      message: "Product and Inventory added successfully",
      data: product,
    });
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ message: "Failed to add product and inventory" });
  }
};

export const getAllActiveProductsController = async (req, res) => {
  try {
    const product = await prisma.product.findMany({
        where:{
            is_active:true
        }
    })

    return res.status(200).json({
      message: "All Active Products fetch Successfully",
      data: product,
    });
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ message: "Failed to get all active products" });
  }
};

export const getProductByIdController = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
        where:{
            id:Number(req.params.id)
        }
    })

    if(!product){
        return res.status(404).json({
            message:"Product Not Found"
        })
    }

    return res.status(200).json({
      message: "Product fetch Successfully",
      data: product,
    });
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ message: "Failed to get product" });
  }
};
