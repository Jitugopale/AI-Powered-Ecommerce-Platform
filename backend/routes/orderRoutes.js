import express from "express"
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { checkoutController } from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.use(authMiddleware)
orderRouter.post('/checkout',roleMiddleware("USER"),checkoutController)

export default orderRouter;