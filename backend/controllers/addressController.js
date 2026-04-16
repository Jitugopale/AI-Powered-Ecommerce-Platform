import { prisma } from "../services/prisma.js";

export const addAddressController = async(req,res)=>{
    const {addressline,state,city,pincode} = req.body;

    if(!addressline || !state || !city || !pincode){
        return res.status(400).json({
            message:"All fields are required"
        })
    }
    try {

        const userId = req.user.id;
           const address = await prisma.address.create({
        data:{
            addressline,
            state,
            city,
            pincode,
            userId:userId
        }
    })

    return res.status(201).json({
        message:"Address added Successfully",
        data:address
    })
    } catch (error) {
        return res.status(500).json({message:"Failed to add address"})
    }
}