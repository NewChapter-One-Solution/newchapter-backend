import { Router } from "express";
import * as adminController from "../controllers/adminController";
import jwtAuthMiddleware from "../middleware/jwtMiddleware";
import { requireRole } from "../middleware/rbacMiddleware";
import { Role } from "../../generated/prisma";

const adminRouter = Router();

// All admin routes require authentication and ADMIN role
adminRouter.use(jwtAuthMiddleware);
adminRouter.use(requireRole(Role.ADMIN));

// Essential admin functionality for inventory management
adminRouter.get("/dashboard", adminController.getDashboardStats);
adminRouter.get("/users", adminController.getAllUsers);
adminRouter.patch("/users/:userId/status", adminController.updateUserStatus);
adminRouter.patch("/users/:userId/role", adminController.updateUserRole);


export default adminRouter;
