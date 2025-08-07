import { Router } from "express";
import * as purchaseController from "../controllers/purchaseController";

const purchaseRouter = Router();

// Create new purchase with batch tracking
purchaseRouter.post("/", purchaseController.createPurchase);

// Return purchase item with batch tracking
purchaseRouter.post("/return", purchaseController.returnPurchaseItem);

// Get all purchases with batch information
purchaseRouter.get("/", purchaseController.getPurchases);

// Get purchase by ID with batch details
purchaseRouter.get("/:id", purchaseController.getPurchaseById);

export default purchaseRouter;