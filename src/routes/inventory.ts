import { Router } from "express";
import * as inventoryController from "../controllers/inventoryController";
import jwtAuthMiddleware from "../middleware/jwtMiddleware";
import { requirePermissions, PERMISSIONS } from "../middleware/rbacMiddleware";

const inventoryRouter = Router();

// All routes require authentication
inventoryRouter.use(jwtAuthMiddleware);

inventoryRouter
  .route("/")
  .post(
    requirePermissions([PERMISSIONS.INVENTORY_CREATE]),
    inventoryController.createInventory
  );

inventoryRouter.post(
  "/adjust",
  requirePermissions([PERMISSIONS.INVENTORY_UPDATE]),
  inventoryController.adjustInventory
);

inventoryRouter.get(
  "/:shopId",
  requirePermissions([PERMISSIONS.INVENTORY_READ]),
  inventoryController.getInventoryByShopId
);

inventoryRouter.get(
  "/low-stock/:shopId",
  requirePermissions([PERMISSIONS.INVENTORY_READ]),
  inventoryController.getLowStock
);

inventoryRouter.get(
  "/logs/:shopId",
  requirePermissions([PERMISSIONS.INVENTORY_READ]),
  inventoryController.getStockLogs
);

// Low stock alert routes
inventoryRouter.post(
  "/alerts/:shopId",
  requirePermissions([PERMISSIONS.INVENTORY_UPDATE]),
  inventoryController.sendLowStockAlert
);

inventoryRouter.post(
  "/alerts/send-all",
  requirePermissions([PERMISSIONS.INVENTORY_UPDATE]),
  inventoryController.sendAllLowStockAlerts
);

inventoryRouter.get(
  "/alerts/summary",
  requirePermissions([PERMISSIONS.INVENTORY_READ]),
  inventoryController.getLowStockSummary
);

inventoryRouter.get(
  "/alerts/detailed",
  requirePermissions([PERMISSIONS.INVENTORY_READ]),
  inventoryController.getLowStockItemsDetailed
);

// Admin only - trigger manual low stock check
inventoryRouter.post(
  "/alerts/trigger-check",
  requirePermissions([PERMISSIONS.ADMIN_ACCESS]),
  inventoryController.triggerLowStockCheck
);

export default inventoryRouter;
