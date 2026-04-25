import express from "express"
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { adminGetAllOrdersController, adminUpdateOrderItemStatusController, cancelOrderItemController, checkoutController, getMyOrderByIdController, getMyOrdersController, getOrderItemByIdController, verifyPaymentController } from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.use(authMiddleware)
orderRouter.post('/checkout',roleMiddleware("USER"),checkoutController)
orderRouter.post('/verify-payment',roleMiddleware("USER"),verifyPaymentController)
orderRouter.get('/my-orders',roleMiddleware("USER"),getMyOrdersController)
orderRouter.get('/my-orders/:orderId',roleMiddleware("USER"),getMyOrderByIdController)
orderRouter.get('/admin/all-orders',roleMiddleware("ADMIN","SUPER_ADMIN"),adminGetAllOrdersController)
orderRouter.patch('/cancel/:orderItemId',roleMiddleware("USER"),cancelOrderItemController)
orderRouter.patch('/admin/:orderItemId/status',roleMiddleware("ADMIN","SUPER_ADMIN"),adminUpdateOrderItemStatusController)
orderRouter.get('/item/:orderItemId',roleMiddleware("USER"),getOrderItemByIdController)

export default orderRouter;