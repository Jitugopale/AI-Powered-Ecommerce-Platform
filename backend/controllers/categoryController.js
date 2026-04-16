import { prisma } from "../services/prisma.js";

export const addCategoryController = async(req,res)=>{
    const {name} = req.body;

    if(!name){
        return res.status(400).json({
            message:"Category name is required"
        })
    }


    try {

        const caregoryExists = await prisma.categories.findFirst({
            where:{
                name:name
            }
        })

        if(caregoryExists){
            return res.status(400).json({
                message:"Category already exits"
            })
        }
         const Category = await prisma.categories.create({
        data:{
            name:name
        }
    })

    return res.status(201).json({
        message:"Category added Successfully"
    })
    } catch (error) {
        return res.status(500).json({
            message:"Failed to add category"
        })
    }
}