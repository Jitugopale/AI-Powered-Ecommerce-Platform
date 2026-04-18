import express from "express"
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { addToCartController, clearCartController, decrementToCartController, removeFromCartController, viewCartController } from "../controllers/cartController.js";

const cartRouter = express.Router();

cartRouter.use(authMiddleware)
cartRouter.post('/add',roleMiddleware("USER"),addToCartController)
cartRouter.get('/',roleMiddleware("USER"),viewCartController)
cartRouter.put('/decrement',roleMiddleware("USER"),decrementToCartController)
cartRouter.delete('/remove',roleMiddleware("USER"),removeFromCartController)
cartRouter.delete('/clear',roleMiddleware("USER"),clearCartController)

export default cartRouter;