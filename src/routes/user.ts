import { Router } from "express";
import * as userController from "../controllers/userController";
import jwtAuthMiddleware from "../middleware/jwtMiddleware";
import { requirePermissions, PERMISSIONS } from "../middleware/rbacMiddleware";

const userRouter = Router();

// All routes require authentication
userRouter.use(jwtAuthMiddleware);

// Essential user functionality for inventory management
userRouter.get("/me", userController.getUser);
userRouter.get("/", requirePermissions([PERMISSIONS.USER_READ]), userController.getAllUsers);
userRouter.post("/change-password", userController.changePassword);

export default userRouter;
