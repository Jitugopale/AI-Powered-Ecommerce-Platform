import express from "express"
import { getProfileController, loginController, registerController, updateProfileController } from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const authRouter = express.Router();

authRouter.post('/register',registerController)
authRouter.post('/login',loginController)
authRouter.get('/profile', authMiddleware, getProfileController)
authRouter.patch('/profile', authMiddleware, updateProfileController)

export default authRouter;