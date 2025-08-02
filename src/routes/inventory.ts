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

export default inventoryRouter;
