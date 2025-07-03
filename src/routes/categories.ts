import { Router } from "express";
import * as categoriesController from "../controllers/categoriesController";
import jwtAuthMiddleware from "../core/jwtMiddleware";

const categoryRouter = Router();

categoryRouter.route("/").post(jwtAuthMiddleware, categoriesController.createCategory)
    .get(jwtAuthMiddleware, categoriesController.getAllCategories);

categoryRouter.route("/:id").get(jwtAuthMiddleware, categoriesController.getCategoryById)
    .put(jwtAuthMiddleware, categoriesController.updateCategory)
    .delete(jwtAuthMiddleware, categoriesController.deleteCategory);

categoryRouter.get("/search/by", jwtAuthMiddleware, categoriesController.searchCategories);

export default categoryRouter;