import { Router } from "express";
import * as reportsController from "../controllers/reportsController";
import jwtAuthMiddleware from "../middleware/jwtMiddleware";
import { requirePermissions, requireRole, PERMISSIONS } from "../middleware/rbacMiddleware";
import { Role } from "@prisma/client";

const reportsRouter = Router();

// All routes require authentication
reportsRouter.use(jwtAuthMiddleware);

// Business dashboard - accessible to MANAGER+
reportsRouter.get("/dashboard",
  requirePermissions([PERMISSIONS.REPORTS_VIEW]),
  reportsController.getBusinessDashboard
);

// Inventory reports - accessible to MANAGER+
reportsRouter.get("/inventory",
  requirePermissions([PERMISSIONS.REPORTS_VIEW]),
  reportsController.getInventoryReport
);

// Sales reports - accessible to MANAGER+
reportsRouter.get("/sales",
  requirePermissions([PERMISSIONS.REPORTS_VIEW]),
  reportsController.getSalesReport
);

// Product performance - accessible to MANAGER+
reportsRouter.get("/products",
  requirePermissions([PERMISSIONS.REPORTS_VIEW]),
  reportsController.getProductPerformanceReport
);

// Customer analytics - accessible to MANAGER+
reportsRouter.get("/customers",
  requirePermissions([PERMISSIONS.REPORTS_VIEW]),
  reportsController.getCustomerAnalytics
);

// Purchase reports - accessible to MANAGER+
reportsRouter.get("/purchases",
  requirePermissions([PERMISSIONS.REPORTS_VIEW]),
  reportsController.getPurchaseReport
);

// Purchase analytics dashboard - accessible to MANAGER+
reportsRouter.get("/purchases/analytics",
  requirePermissions([PERMISSIONS.REPORTS_VIEW]),
  reportsController.getPurchaseAnalytics
);

// Supplier performance report - accessible to MANAGER+
reportsRouter.get("/suppliers/performance",
  requirePermissions([PERMISSIONS.REPORTS_VIEW]),
  reportsController.getSupplierPerformanceReport
);

export default reportsRouter;