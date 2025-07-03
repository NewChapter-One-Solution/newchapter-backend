
import { Router } from "express";
import * as shopController from "../controllers/shopController";
import jwtAuthMiddleware from "../core/jwtMiddleware";

const shopRouter = Router();

shopRouter.route("/").post(jwtAuthMiddleware, shopController.createShop)

    .get(jwtAuthMiddleware, shopController.getAllShops);

shopRouter.route("/:id").put(jwtAuthMiddleware, shopController.updateShop)

    .delete(jwtAuthMiddleware, shopController.deleteShop)

    .get(jwtAuthMiddleware, shopController.getShopById);



export default shopRouter;
