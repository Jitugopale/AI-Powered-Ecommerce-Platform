import express from "express"
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { addInventoryStockController, removeInventoryStockController } from "../controllers/inventoryController.js";

const inventoryRouter = express.Router();

inventoryRouter.use(authMiddleware)
inventoryRouter.put('/add-stock/:productId',roleMiddleware("ADMIN","SUPER_ADMIN"),addInventoryStockController)
inventoryRouter.put('/remove-stock/:productId',roleMiddleware("ADMIN","SUPER_ADMIN"),removeInventoryStockController)

export default inventoryRouter;