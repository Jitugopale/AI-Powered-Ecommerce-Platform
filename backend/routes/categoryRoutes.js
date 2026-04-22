import express from "express"
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { addCategoryController, deleteCategoryController, getAllCategoriesController, updateCategoryController } from "../controllers/categoryController.js";

const categoryRouter = express.Router();

categoryRouter.use(authMiddleware)
categoryRouter.post('/add',roleMiddleware("ADMIN","SUPER_ADMIN"),addCategoryController)
categoryRouter.get('/',roleMiddleware("ADMIN","SUPER_ADMIN"),getAllCategoriesController)
categoryRouter.patch('/:categoryId',roleMiddleware("ADMIN","SUPER_ADMIN"),updateCategoryController)
categoryRouter.delete('/:categoryId',roleMiddleware("ADMIN","SUPER_ADMIN"),deleteCategoryController)

export default categoryRouter;