import { Router } from "express";
import * as authController from "../controllers/authController";
import jwtAuthMiddleware from "../middleware/jwtMiddleware";
// import jwtAuthMiddleware, { rateLimitMiddleware } from "../middleware/jwtMiddleware";

const authRouter = Router();

// Public routes with rate limiting
// authRouter
//   .route("/register")
//   .post(rateLimitMiddleware(5, 15 * 60 * 1000), authController.register);

authRouter.route("/register").post(authController.register);
authRouter.route("/login").post(authController.login);
authRouter.route("/refresh-token").post(authController.refreshAccessToken);

// Protected routes
authRouter.route("/logout").post(jwtAuthMiddleware, authController.logout);
authRouter.route("/me").get(jwtAuthMiddleware, authController.getCurrentUser);
authRouter.route("/permissions").get(jwtAuthMiddleware, authController.getUserPermissions);

export default authRouter;
