import { Router } from "express";

import * as productController from "../controllers/productsController";
import jwtAuthMiddleware from "../core/jwtMiddleware";

const productRouter = Router();

productRouter.route("/").post(jwtAuthMiddleware, productController.createProduct);
productRouter.route("/").get(jwtAuthMiddleware, productController.getAllProducts);
productRouter.route("/:id").get(jwtAuthMiddleware, productController.getProductBy);
productRouter.route("/:id").put(jwtAuthMiddleware, productController.updateProduct);
productRouter.route("/:id").delete(jwtAuthMiddleware, productController.deleteProduct);

export default productRouter;
