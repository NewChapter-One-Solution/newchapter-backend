import { Router } from "express";
import * as warehouseController from "../controllers/warehouseController";
import jwtAuthMiddleware from "../core/jwtMiddleware";
const warehouseRouter = Router();

warehouseRouter.route("/").post(jwtAuthMiddleware, warehouseController.createWarehouse)
    .get(jwtAuthMiddleware, warehouseController.getAllWarehouses);

warehouseRouter.route("/:id").get(jwtAuthMiddleware, warehouseController.getWarehouseById)
    .put(jwtAuthMiddleware, warehouseController.updateWarehouse)
    .delete(jwtAuthMiddleware, warehouseController.deleteWarehouse);

export default warehouseRouter;