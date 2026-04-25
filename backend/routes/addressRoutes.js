import express from "express"
import { addAddressController, deleteAddressController, getMyAddressesController, updateAddressController } from "../controllers/addressController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const addressRouter = express.Router();

addressRouter.use(authMiddleware)
addressRouter.post('/add',roleMiddleware("USER"),addAddressController)
addressRouter.patch('/update/:addressId',roleMiddleware("USER"),updateAddressController)
addressRouter.delete('/delete/:addressId',roleMiddleware("USER"),deleteAddressController)
addressRouter.get('/',roleMiddleware("USER"),getMyAddressesController)

export default addressRouter;