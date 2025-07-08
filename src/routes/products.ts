import { Router } from "express";

import * as productController from "../controllers/productsController";
import jwtAuthMiddleware from "../core/jwtMiddleware";
import { singleUpload } from "../core/multer";

const productRouter = Router();

productRouter.route("/").post(jwtAuthMiddleware, singleUpload, productController.createProduct);
productRouter.route("/").get(jwtAuthMiddleware, productController.getAllProducts);
productRouter.route("/:id").get(jwtAuthMiddleware, productController.getProductBy);
productRouter.route("/:id").put(jwtAuthMiddleware, singleUpload, productController.updateProduct);
productRouter.route("/:id").delete(jwtAuthMiddleware, productController.deleteProduct);

export default productRouter;
