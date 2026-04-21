import express from "express"
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { checkoutController, getMyOrdersController, verifyPaymentController } from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.use(authMiddleware)
orderRouter.post('/checkout',roleMiddleware("USER"),checkoutController)
orderRouter.post('/verify-payment',roleMiddleware("USER"),verifyPaymentController)
orderRouter.get('/my-orders',roleMiddleware("USER"),getMyOrdersController)

export default orderRouter;