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

export const updateProductController = async(req,res) =>{
  const productId = Number(req.params.id);
  if(isNaN(productId)){
    return res.status(400).json({
      message:"Invalid productId"
    })
  }

  const { name, description, price, brand, categoryId } = req.body;
  
  if(!name && !description && !price && !brand && !categoryId){
    return res.status(400).json({
      message:"At least one field is required"
    })
  }

  try {
    const product = await prisma.product.findUnique({
      where:{
        id:productId
      }
    })
    if(!product){
      return res.status(404).json({
        message:"Product not found"
      })
    }

    const updateData = {}
    if(name) updateData.name = name
    if(description) updateData.description = description
    if(price) updateData.price = price
    if(brand) updateData.brand = brand
    if(categoryId) updateData.categoryId = categoryId

    const updateProduct = await prisma.product.update({
      where:{
        id:productId
      },
      data:updateData
    })

    return res.status(200).json({
      message:"Updated product sucessfully",
      data: updateProduct
    })

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message:"Failed to updated product"
    })
  }
}

export const updateProductStatusController = async(req,res) =>{
  const productId = Number(req.params.id);
  if(isNaN(productId)){
    return res.status(400).json({
      message:"Invalid productId"
    })
  }
  const {is_active} = req.body;

  if(is_active === undefined || is_active === null){
    return res.status(400).json({
      message:"is_active is required"
    })
  }

  if(typeof(is_active) !== 'boolean'){
    return res.status(400).json({
      message:"is_active must be true or false"
    })
  }
  try {
    const product = await prisma.product.findUnique({
      where:{
        id:productId
      }
    })

    if(!product){
      return res.status(404).json({
        message:"Product not found"
      })
    }

    if(product.is_active === is_active){
      return res.status(409).json({
        message:`Product is already ${is_active ? 'active' : 'deactivated'}`
        //If is_active is true: The output string is "Product is already active".
        //If is_active is false: The output string is "Product is already deactivated"
      })
    }

    const updateStatus = await prisma.product.update({
      where:{
        id:productId
      },
      data:{
        is_active:is_active
      }
    })

    return res.status(200).json({
      message:`Product ${is_active ? 'activated' : 'deactivated'} successfully`
    })
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message:"Failed to update product status"
    })
  }
}