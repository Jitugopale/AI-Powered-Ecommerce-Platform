import express from "express"
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { addProductController, getAllActiveProductsController, getProductByIdController, updateProductController, updateProductStatusController, filterProductsController } from "../controllers/productController.js";

const productRouter = express.Router();

productRouter.use(authMiddleware)
productRouter.post('/add',roleMiddleware("ADMIN","SUPER_ADMIN"),addProductController)
productRouter.get('/all',getAllActiveProductsController)
productRouter.get('/filter',filterProductsController)
productRouter.get('/:id',getProductByIdController)
productRouter.patch('/:id/status',roleMiddleware("ADMIN","SUPER_ADMIN"), updateProductStatusController)
productRouter.patch('/:id',roleMiddleware("ADMIN","SUPER_ADMIN"), updateProductController)

export default productRouter;