import { prisma } from "../services/prisma.js";
import {v4 as uuidv4} from "uuid"
import { razorpay } from "../services/razorpay.js";

export const checkoutController = async(req,res)=>{
    const {addressId, cartType} = req.body;
    const parsedAddressId = Number(addressId);
    const parsedCartType = cartType;
    const userId = Number(req.user.id);
    if(!addressId || !cartType){
        return res.status(400).json({
            message:"All fields are required"
        })
    }

    try {
        const address = await prisma.address.findFirst({
            where:{
                id:parsedAddressId,
                userId:userId
            }
        })

        if(!address){
            return res.status(404).json({
                message:"Address not found"
            })
        }

        const cart = await prisma.cart.findFirst({
            where:{
                userId:userId,
                cartType:parsedCartType
            }
        })

        if(!cart){
            return res.status(404).json({
                message:"Cart not found"
            })
        }

        const cartItems = await prisma.cartItem.findMany({
            where:{
                cartId:cart.id
            },
            include:{
                product:true
            }     
        })

        if(cartItems.length === 0){
            return res.status(400).json({
                message:"Cart is empty"
            })
        }

        const existingPendingOrder = await prisma.order.findFirst({                                                                   
          where:{                             
            userId,                                                                                                               
            status: "PENDING", 
            source: cartType === "BUY_NOW" ? "BUY_NOW" : "CART"                                                                                                                                                                              
          },  
          include:{
            payment:true
          }                                                                                                                            
        })

         if(existingPendingOrder && !existingPendingOrder.payment.razorpayOrderId){
      try{                                
          const razorpayOrder = await razorpay.orders.create({
              amount: Math.round(Number(existingPendingOrder.totalAmount) * 100),                                                             
              currency: "INR",            
              receipt: "order_" + existingPendingOrder.id                                                                                 
            })                                                                                                                    
                                                                                                                                
          await prisma.payment.update({                                                                                         
              where:{ orderId: existingPendingOrder.id },                                                                       
              data:{ razorpayOrderId: razorpayOrder.id }
          })

          return res.status(200).json({
              message: "Retrying payment for existing order",
              data:{
                  orderId: existingPendingOrder.id,
                  razorpayOrderId: razorpayOrder.id,
                  amount: existingPendingOrder.totalAmount,
                  currency: "INR"
              }
          })
      } catch(retryError){
          return res.status(500).json({
              message: "Payment retry failed. Please try again later.",
              orderId: existingPendingOrder.id
          })
      }
  }

        for(const item of cartItems){
            const inventory = await prisma.inventory.findFirst({
                where:{
                    productId:item.productId
                }
            })

            if(!inventory){
                throw new Error(`Inventory not found for product ${item.id}`)
            }

            if(inventory.quantity < item.quantity){
                throw new Error(`Only ${inventory.quantity} available for product ${item.product.name}`)
            }
        }

        let totalAmount = 0;

        for(let item of cartItems){
            totalAmount = totalAmount + Number(item.product.price)*item.quantity;
        }

        const result = await prisma.$transaction(async(tx)=>{
            const order = await tx.order.create({
                data:{
                    userId:userId,
                    addressId:parsedAddressId,
                    totalAmount:totalAmount,
                    status:"PENDING",
                    source:parsedCartType === "BUY_NOW" ? "BUY_NOW" : "CART"
                }
            })


            await tx.orderItem.createMany({
                data: cartItems.map(item =>({
                    orderId:order.id,
                    productId:item.productId,
                    quantity:item.quantity,
                    price:item.product.price,
                    status:"PENDING"
                }))
            })

            for(let item of cartItems){
                await tx.inventory.update({
                    where:{
                        productId:item.productId
                    },
                    data:{
                        quantity:{
                            decrement:item.quantity
                        }
                    }
                })
            }

            //clear cart shipped to verify payment - because if at last if razorpay OrderId not saved issue
            //razorpayOrderId not saved - Cart is EMPTY - User tries checkout again → "Cart is empty"
            //Razorpay fails → cart still has items → user retries checkout
            //Payment verified → cart cleared

            // await tx.cartItem.deleteMany({
            //     where:{
            //         cartId:cart.id
            //     }
            // })

            const payment = await tx.payment.create({
                data:{
                    orderId:order.id,
                    amount:totalAmount,
                    status:"PENDING"
                }
            })

            const today = new Date();
            //today.toISOString() - 2026-04-19T07:30:45.123Z
            //.slice(0, 10) - 2026-04-19
            //.replace(/-/g, "") - 20260419
            const datePart = today.toISOString().slice(0, 10).replace(/-/g,"");
            const invoiceNumber = `INV-${datePart}-${uuidv4().slice(0, 6)}`; //INV-20260419-a3f9c1

            await tx.invoice.create({
                data:{
                    orderId:order.id,
                    paymentId:payment.id,
                    invoiceNumber:invoiceNumber,
                    status:"UNPAID"
                }
            })

            return {order, payment}

        })

        //razorpay.orders.create() tells Razorpay: 
        //"Hey Razorpay, I want to collect ₹500 from my user. Create a payment session for this."
        try{

        const razorpayOrder = await razorpay.orders.create({
            //(Math.round()): 876708.56 rounds to 876709 (Rounds up, >=.5) // 876708.46 rounds to 876708 (Rounds up, <=.5)
 
            amount:Math.round(totalAmount*100),
            //Tells Razorpay which currency — Indian Rupees
            currency:"INR",
            //internal reference — like a label so you know which order this payment belongs to. Not shown to user, just for yourtracking
            receipt:"order_"+ result.order.id
        })

        //What Razorpay Returns
        //razorpayOrder = {
        // id: "order_xyz123",    ← razorpayOrderId (send to frontend)
        // amount: 50000,
        // currency: "INR",
        // status: "created"
        //} Frontend uses razorpayOrder.id to open payment modal

        await prisma.payment.update({
            where:{
                orderId:result.order.id
            },
            data:{
                razorpayOrderId:razorpayOrder.id
            }
        })

        return res.status(201).json({
      message: "Order placed successfully",
      data:{
          orderId: result.order.id,
          razorpayOrderId: razorpayOrder.id,
          amount: totalAmount,
          currency: "INR"
      }
  })
        } catch(razorpayError) {
      // Order exists in DB but payment failed
      // let user retry payment
      //frontend - go to payment failed page retry payment
      return res.status(500).json({
          message: "Order created but payment initiation failed. Please retry payment.",
          orderId: result.order.id  // ← return orderId so user can retry
      })
  }

    
        
    } catch (error) {
        if(error.message?.includes("available") || error.message?.includes("Inventory")){
          return res.status(400).json({ message: error.message })
      }
        return res.status(500).json({
            message:"failed to checkout order"
        })
    }
}