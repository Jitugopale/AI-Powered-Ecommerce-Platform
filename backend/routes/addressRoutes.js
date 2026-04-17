import express from "express"
import { addAddressController } from "../controllers/addressController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const addressRouter = express.Router();

addressRouter.use(authMiddleware)
addressRouter.post('/add',roleMiddleware("USER"),addAddressController)

export default addressRouter;