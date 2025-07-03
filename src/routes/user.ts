import { Router } from "express";
import * as userController from "../controllers/userController";
import jwtAuthMiddleware from "../core/jwtMiddleware";


const userRouter = Router();

userRouter.route("/me").get(jwtAuthMiddleware, userController.getUser);
userRouter.route("/").get(jwtAuthMiddleware, userController.getAllUsers);
userRouter.route("/update-role").post(jwtAuthMiddleware, userController.updateUserRole);
userRouter.route("/change-password").post(jwtAuthMiddleware, userController.changePassword);

export default userRouter;