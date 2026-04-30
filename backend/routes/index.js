import express from "express"
import authRouter from "./authRoutes.js";
import addressRouter from "./addressRoutes.js";
import categoryRouter from "./categoryRoutes.js";
import productRouter from "./productRoutes.js";
import inventoryRouter from "./inventoryRoutes.js";
import cartRouter from "./cartRoutes.js";
import orderRouter from "./orderRoutes.js";
import recommendationRouter from "./recommendationRoutes.js";

const rootRouter = express.Router();

rootRouter.use('/auth',authRouter)
rootRouter.use('/address',addressRouter)
rootRouter.use('/category',categoryRouter)
rootRouter.use('/product',productRouter)
rootRouter.use('/inventory',inventoryRouter)
rootRouter.use('/cart',cartRouter)
rootRouter.use('/order',orderRouter)
rootRouter.use('/recommendation',recommendationRouter)

export default rootRouter;