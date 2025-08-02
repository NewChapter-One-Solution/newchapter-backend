import { Router } from "express";

import * as productController from "../controllers/productsController";
import jwtAuthMiddleware from "../middleware/jwtMiddleware";
import { singleUpload } from "../middleware/multer";
import { requirePermissions, PERMISSIONS } from "../middleware/rbacMiddleware";

const productRouter = Router();

// All routes require authentication
productRouter.use(jwtAuthMiddleware);

productRouter
  .route("/")
  .post(
    requirePermissions([PERMISSIONS.PRODUCT_CREATE]),
    singleUpload,
    productController.createProduct
  )
  .get(
    requirePermissions([PERMISSIONS.PRODUCT_READ]),
    productController.getAllProducts
  );

productRouter
  .route("/:id")
  .get(
    requirePermissions([PERMISSIONS.PRODUCT_READ]),
    productController.getProductBy
  )
  .put(
    requirePermissions([PERMISSIONS.PRODUCT_UPDATE]),
    singleUpload,
    productController.updateProduct
  )
  .delete(
    requirePermissions([PERMISSIONS.PRODUCT_DELETE]),
    productController.deleteProduct
  );

export default productRouter;
