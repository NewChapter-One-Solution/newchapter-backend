import { Router } from "express";
import * as purchaseController from "../controllers/purchaseController";


const purchaseRouter = Router();

purchaseRouter.post("/", purchaseController.createPurchase);
purchaseRouter.post("/return", purchaseController.returnPurchaseItem);

export default purchaseRouter;