import { prisma } from "../services/prisma.js";

export const addInventoryStockController = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity) {
      return res.status(400).json({
        message: "quantity is required",
      });
    }

    const checkProduct = await prisma.inventory.findUnique({
        where:{
            productId:Number(req.params.productId)
        }
    })

    if(!checkProduct){
        return res.status(404).json({
            message:"Product not found"
        })
    }

    const stock = await prisma.inventory.update({
        where:{
            productId:Number(req.params.productId)
        },
        data:{
            quantity:{
                increment:quantity
            }
        }
    })

    return res.status(200).json({
        message:"Stock quantity added Successfully",
        data:stock
    })
  } catch (error) {
    return res.status(500).json({ message: "Failed to add stock quantity" });
  }
};

export const removeInventoryStockController = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity) {
      return res.status(400).json({
        message: "quantity is required",
      });
    }

    const checkProduct = await prisma.inventory.findUnique({
        where:{
            productId:Number(req.params.productId)
        }
    })

    if(!checkProduct){
        return res.status(404).json({
            message:"Product not found"
        })
    }

    if(checkProduct.quantity<quantity){
        return res.status(400).json({
            message:`Only ${checkProduct.quantity} items available, cannot remove ${quantity}`
        })
    }

    const stock = await prisma.inventory.update({
        where:{
            productId:Number(req.params.productId)
        },
        data:{
            quantity:{
                decrement:quantity
            }
        }
    })

    return res.status(200).json({
        message:"Stock quantity removed Successfully",
        data:stock
    })
  } catch (error) {
    return res.status(500).json({ message: "Failed to remove stock quantity" });
  }
};
