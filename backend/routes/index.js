import express from "express"
import authRouter from "./authRoutes.js";
import addressRouter from "./addressRoutes.js";
import categoryRouter from "./categoryRoutes.js";
import productRouter from "./productRoutes.js";
import inventoryRouter from "./inventoryRoutes.js";
import cartRouter from "./cartRoutes.js";

const rootRouter = express.Router();

rootRouter.use('/auth',authRouter)
rootRouter.use('/address',addressRouter)
rootRouter.use('/category',categoryRouter)
rootRouter.use('/product',productRouter)
rootRouter.use('/inventory',inventoryRouter)
rootRouter.use('/cart',cartRouter)

export default rootRouter;