import { compare, hash } from "bcrypt";
import { prisma } from "../services/prisma.js";
import jwt from "jsonwebtoken"

export const registerController = async(req,res)=>{
    const {name,email,mobile_no,password} = req.body;

    if(!name || !email || !mobile_no || !password){
        return res.status(400).json({message:"All fields are required"})
    }

    const userExists = await prisma.user.findUnique({
        where:{
            email:email
        }
    })

    if(userExists){
        return res.status(400).json({
            message:"User already exists"
        })
    }

    const hashPassword = await hash(password,10);

    const user = await prisma.user.create({
        data:{
            name,
            email,
            mobile_no,
            password:hashPassword
        }
    })

    return res.status(201).json({
        message:"User Register Successfully",
        data:user
    })
} 

export const loginController = async(req,res)=>{
    const {email,password} = req.body;

    if(!email || !password){
        return res.status(400).json({message:"All fields are required"})
    }

    const userExists = await prisma.user.findUnique({
        where:{
            email:email
        }
    })

    if(!userExists){
        return res.status(404).json({
            message:"User not found"
        })
    }

    const passwordCompare = await compare(password,userExists.password)

    if(!passwordCompare){
        return res.status(400).json({
            message:"Invalid Password"
        })
    }

   const token = jwt.sign({id:userExists.id,role:userExists.role},process.env.JWT_SECRET,{expiresIn:"1d"})

    return res.status(200).json({
        message:"User loggedIn Successfully",
        data:userExists,
        token
    })
} 