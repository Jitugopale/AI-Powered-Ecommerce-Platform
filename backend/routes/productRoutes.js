import express from "express"
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { addProductController, getAllActiveProductsController, getProductByIdController } from "../controllers/productController.js";

const productRouter = express.Router();

productRouter.use(authMiddleware)
productRouter.post('/add',roleMiddleware("ADMIN","SUPER_ADMIN"),addProductController)
productRouter.get('/all',getAllActiveProductsController)
productRouter.get('/:id',getProductByIdController)

export default productRouter;