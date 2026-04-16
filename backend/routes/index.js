import express from "express"
import authRouter from "./authRoutes.js";
import addressRouter from "./addressRoutes.js";
import categoryRouter from "./categoryRoutes.js";

const rootRouter = express.Router();

rootRouter.use('/auth',authRouter)
rootRouter.use('/address',addressRouter)
rootRouter.use('/category',categoryRouter)

export default rootRouter;