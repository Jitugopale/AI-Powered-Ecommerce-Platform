import express from "express"
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { addCategoryController } from "../controllers/categoryController.js";

const categoryRouter = express.Router();

categoryRouter.use(authMiddleware,roleMiddleware("ADMIN","SUPER_ADMIN"))
categoryRouter.post('/add',addCategoryController)

export default categoryRouter;