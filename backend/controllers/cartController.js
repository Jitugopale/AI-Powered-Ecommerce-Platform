import { prisma } from "../services/prisma.js";


export const addToCartController = async(req,res) =>{
    const {productId, quantity}  = req.body;
    const parsedProductId = Number(productId);
    const parsedQuantity = Number(quantity);


    if(!productId || !quantity || parsedQuantity <= 0){
        return res.status(400).json({
            message:"Valid Product ID and Quantity are required"
        })
    }

    try {
        const product = await prisma.product.findFirst({
        where:{
            id:parsedProductId,
            is_active:true
        }
    })

    if(!product){
        return res.status(404).json({
            message:"Product Not Found"
        })
    }

    const cartItem = await prisma.$transaction(async(tx)=>{


    const inventory = await tx.inventory.findFirst({
        where:{
            productId:parsedProductId
        }
    })

    if (!inventory) {
        throw new Error("Inventory not found, stock not available")
    }

         const cart = await tx.cart.upsert({
        where:{
            userId_cartType:{
                userId:Number(req.user.id),
                cartType:"REGULAR"
            }
        },
        update:{},
        create:{
            userId:Number(req.user.id),
            cartType:"REGULAR"
        }
    })

    
    const existingCartItem = await tx.cartItem.findUnique({
        where:{
            cartId_productId:{
                cartId:cart.id,
                productId:parsedProductId
            }
        }
    })

    const alreadyInCart = existingCartItem ? existingCartItem.quantity : 0;

    const totalQuantity = alreadyInCart + parsedQuantity;

    if(inventory.quantity < totalQuantity){
        throw new Error(`Only ${inventory.quantity} available, cannot add ${parsedQuantity}`)
    }

    const cartItem = await tx.cartItem.upsert({
        where:{
            cartId_productId:{
                cartId:cart.id,
                productId:parsedProductId
            }           
        },
        update:{
            quantity:{
                increment:parsedQuantity
            }
        },
        create:{
            cartId:cart.id,
            productId:Number(productId),
            quantity:parsedQuantity
        },
        include:{
            cart:true
        }
    })

    return cartItem;

    })

   
    return res.status(200).json({
        message:"added item to cart successfully",
        data:cartItem
    })
    } catch (error) {
        if(error.message?.includes("available") || error.message?.includes("Inventory")){
            return res.status(400).json({
                message:error.message
            })
        }
        return res.status(500).json({ message: "Failed to add item to cart" })
    }
  
}

export const viewCartController = async(req,res) =>{
    const userId = Number(req.user.id)
    try {
        const user = await prisma.user.findFirst({
            where:{
                id:userId
            }
        })

        if(!user){
            return res.status(404).json({
                message:"User not found"
            })
        }

        const cart = await prisma.cart.findUnique({
            where:{
                userId_cartType:{
                    userId:userId,
                    cartType:"REGULAR"
                }
            }
        })

        if(!cart){
            return res.status(404).json({
                message:"Cart not found"
            })
        }

        const cartItem = await prisma.cartItem.findMany({
            where:{
                cartId:cart.id
            },
            include:{
                product:{
                    select:{
                        name:true,
                        price:true,
                        brand:true
                    }
                }
            }
        })


    return res.status(200).json({
        message:"Cart fetched successfully",
        data:cartItem
    })
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetched Cart" })
    }
  
}

export const decrementToCartController = async(req,res) =>{
    const {productId, quantity}  = req.body;
    const parsedProductId = Number(productId);
    const parsedQuantity = Number(quantity);


    if(!productId || !quantity || parsedQuantity <= 0){
        return res.status(400).json({
            message:"Valid Product ID and Quantity are required"
        })
    }

    try {
        const product = await prisma.product.findFirst({
        where:{
            id:parsedProductId,
            is_active:true
        }
    })

    if(!product){
        return res.status(404).json({
            message:"Product Not Found"
        })
    }

    const cartItem = await prisma.$transaction(async(tx)=>{


    const inventory = await tx.inventory.findFirst({
        where:{
            productId:parsedProductId
        }
    })

    if (!inventory) {
        throw new Error("Inventory not found, stock not available")
    }

    const cart = await tx.cart.findUnique({
        where:{
            userId_cartType:{
                userId:Number(req.user.id),
                cartType:"REGULAR"
            }
        }
    })

    if(!cart){
        throw new Error("Cart not Found")
    }

    const existingCartItem = await tx.cartItem.findUnique({
        where:{
            cartId_productId:{
                cartId:cart.id,
                productId:parsedProductId
            }
        }
    })

    if(!existingCartItem){
        throw new Error("Item not found in cart")
    }

    const alreadyInCart = existingCartItem.quantity;

    const totalQuantity = alreadyInCart - parsedQuantity;

    if(totalQuantity <= 0){
        await tx.cartItem.delete({
            where:{
                cartId_productId:{
                    cartId:cart.id,
                    productId:parsedProductId
                }
            }
        })
        return null;
    }

    const cartItem = await tx.cartItem.update({
        where:{
            cartId_productId:{
                cartId:cart.id,
                productId:parsedProductId
            }           
        },
        data:{
            quantity:{
                decrement:parsedQuantity
            }
        },
        include:{
            cart:true,
            product:true
        }
    })

    return cartItem;

    })

   
    return res.status(200).json({
        message:cartItem ? "Cart item decremented successfully" : "Item removed from cart",
        data:cartItem
    })
    } catch (error) {
        if(error.message?.includes("Inventory") || error.message?.includes("Cart")){
            return res.status(400).json({
                message:error.message
            })
        }
        return res.status(500).json({ message: "Failed to decrement item to cart" })
    }
  
}

export const removeFromCartController = async(req,res)=>{
    const {productId} = req.body;
    const parsedProductId = Number(productId);
    if(!productId){
        return res.status(400).json({
            message:"productId is required"
        })
    }

    const userId = Number(req.user.id);
     try {
        const cart = await prisma.cart.findUnique({
            where:{
                userId_cartType:{
                    userId:userId,
                    cartType:"REGULAR"
                }
            }
        })

        if(!cart){
            return res.status(404).json({
                message:"Cart not found"
            })
        }

        const cartItem = await prisma.cartItem.findUnique({
            where:{
                cartId_productId:{
                    cartId:cart.id,
                    productId:parsedProductId
                }
            }
        })

        if(!cartItem){
            return res.status(404).json({
                message:"cart item not exist"
            })
        }

        const deleteItem = await prisma.cartItem.delete({
            where:{
                cartId_productId:{
                    cartId:cart.id,
                    productId:parsedProductId
                }
            },          
        })

        return res.status(200).json({
            message:"item deleted from cart successfully",
            data:deleteItem
        })
    } catch (error) {
        return res.status(500).json({
            message:"Failed to remove item from cart"
        })
    }
}


export const clearCartController = async(req,res)=>{
    const userId = Number(req.user.id);
     try {
        const cart = await prisma.cart.findUnique({
            where:{
                userId_cartType:{
                    userId:userId,
                    cartType:"REGULAR"
                }
            }
        })

        if(!cart){
            return res.status(404).json({
                message:"Cart not found"
            })
        }

        const checkCartItems = await prisma.cartItem.findMany({
            where:{
                cartId:cart.id
            }
        })

        if(checkCartItems.length===0){
            return res.status(400).json({
                message:"No cart items added"
            })
        }

        const deleteItems = await prisma.cartItem.deleteMany({
            where:{
                cartId:cart.id,
            }
        })

        return res.status(200).json({
            message:"All items cleared from cart successfully",
            data:deleteItems
        })
    } catch (error) {
        return res.status(500).json({
            message:"Failed to clear items from cart"
        })
    }
}

export const buyNowController = async(req,res)=>{
    const {productId, quantity}  = req.body;
    const parsedProductId = Number(productId);
    const parsedQuantity = Number(quantity);


    if(!productId || !quantity || parsedQuantity <= 0){
        return res.status(400).json({
            message:"Valid Product ID and Quantity are required"
        })
    }


    try {
         const product = await prisma.product.findFirst({
        where:{
            id:parsedProductId,
            is_active:true
        }
    })

    if(!product){
        return res.status(404).json({
            message:"Product Not Found"
        })
    }
    const cartItem = await prisma.$transaction(async(tx)=>{


    const inventory = await tx.inventory.findFirst({
        where:{
            productId:parsedProductId
        }
    })

    if (!inventory) {
        throw new Error("Inventory not found, stock not available")
    }

    if(inventory.quantity < parsedQuantity){
        throw new Error(`Only ${inventory.quantity} available`)
    }

         const cart = await tx.cart.upsert({
        where:{
            userId_cartType:{
                userId:Number(req.user.id),
                cartType:"BUY_NOW"
            }
        },
        update:{},
        create:{
            userId:Number(req.user.id),
            cartType:"BUY_NOW"
        }
    })

    
    await tx.cartItem.deleteMany({
        where:{
            cartId:cart.id
        }
    })

    const cartItem = await tx.cartItem.create({
        data:{
            cartId:cart.id,
            productId:parsedProductId,
            quantity:parsedQuantity
        }
    })



    return cartItem;

    })

   
    return res.status(200).json({
        message:"added item to cart successfully",
        data:cartItem
    })
    } catch (error) {
        if(error.message?.includes("available") || error.message?.includes("Inventory")){
            return res.status(400).json({
                message:error.message
            })
        }
        return res.status(500).json({ message: "Failed to add item to cart" })
    }
}