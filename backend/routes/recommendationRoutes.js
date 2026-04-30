import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { recommendationController } from "../controllers/recommendationController.js";

const recommendationRouter = express.Router();

recommendationRouter.use(authMiddleware);
recommendationRouter.post("/products", recommendationController);

export default recommendationRouter;
