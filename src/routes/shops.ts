import { Router } from "express";
import * as shopController from "../controllers/shopController";
import jwtAuthMiddleware from "../middleware/jwtMiddleware";
import { requirePermissions, PERMISSIONS } from "../middleware/rbacMiddleware";
import { checkShopLimit } from "../middleware/subscriptionMiddleware";

const shopRouter = Router();

// All routes require authentication
shopRouter.use(jwtAuthMiddleware);

shopRouter
  .route("/")
  .post(
    requirePermissions([PERMISSIONS.SHOP_CREATE]),
    checkShopLimit,
    shopController.createShop
  )
  .get(requirePermissions([PERMISSIONS.SHOP_READ]), shopController.getAllShops);

shopRouter
  .route("/:id")
  .get(requirePermissions([PERMISSIONS.SHOP_READ]), shopController.getShopById)
  .put(requirePermissions([PERMISSIONS.SHOP_UPDATE]), shopController.updateShop)
  .delete(
    requirePermissions([PERMISSIONS.SHOP_DELETE]),
    shopController.deleteShop
  );

export default shopRouter;
