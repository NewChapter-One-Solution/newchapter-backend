import { Router } from "express";
import * as authController from "../controllers/authController";

const authRouter = Router();

authRouter.route("/register").post(authController.register);
authRouter.route("/login").post(authController.login);
authRouter.route("/logout").post(authController.logout);
authRouter.route("/refresh-token").post(authController.refreshAccessToken);


export default authRouter;