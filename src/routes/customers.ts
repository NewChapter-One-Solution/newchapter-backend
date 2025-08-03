import { Router } from "express";
import * as customerController from "../controllers/customerController";
import jwtAuthMiddleware from "../middleware/jwtMiddleware";
import { requirePermissions, requireRole, PERMISSIONS } from "../middleware/rbacMiddleware";
import { Role } from "@prisma/client";

const customerRouter = Router();

// All routes require authentication
customerRouter.use(jwtAuthMiddleware);

// Customer management routes
customerRouter.post("/",
  requirePermissions([PERMISSIONS.SALES_CREATE]),
  customerController.createCustomer
);

customerRouter.get("/",
  requirePermissions([PERMISSIONS.SALES_READ]),
  customerController.getAllCustomers
);

customerRouter.get("/top",
  requirePermissions([PERMISSIONS.REPORTS_VIEW]),
  customerController.getTopCustomers
);

customerRouter.get("/:id",
  requirePermissions([PERMISSIONS.SALES_READ]),
  customerController.getCustomerById
);

customerRouter.put("/:id",
  requirePermissions([PERMISSIONS.SALES_UPDATE]),
  customerController.updateCustomer
);

customerRouter.delete("/:id",
  requireRole(Role.ADMIN),
  customerController.deleteCustomer
);

customerRouter.get("/:id/purchases",
  requirePermissions([PERMISSIONS.SALES_READ]),
  customerController.getCustomerPurchaseHistory
);

export default customerRouter;