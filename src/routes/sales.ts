import { Router } from "express";
import * as salesController from "../controllers/salesController";
import jwtAuthMiddleware from "../middleware/jwtMiddleware";
import { requirePermissions, PERMISSIONS } from "../middleware/rbacMiddleware";

const salesRouter = Router();

// All routes require authentication
salesRouter.use(jwtAuthMiddleware);

// Sales management routes
salesRouter.post("/", 
  requirePermissions([PERMISSIONS.SALES_CREATE]), 
  salesController.createSale
);

salesRouter.get("/", 
  requirePermissions([PERMISSIONS.SALES_READ]), 
  salesController.getAllSales
);

salesRouter.get("/analytics", 
  requirePermissions([PERMISSIONS.REPORTS_VIEW]), 
  salesController.getSalesAnalytics
);

salesRouter.get("/shop/:shopId", 
  requirePermissions([PERMISSIONS.SALES_READ]), 
  salesController.getSalesByShop
);

salesRouter.get("/:id", 
  requirePermissions([PERMISSIONS.SALES_READ]), 
  salesController.getSaleById
);

export default salesRouter;