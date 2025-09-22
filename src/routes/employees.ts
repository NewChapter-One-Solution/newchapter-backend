import { Router } from "express";

import * as employeeController from "../controllers/employeeController";
import { checkEmployeeLimit } from "../middleware/subscriptionMiddleware";

const employeeRouter = Router();

employeeRouter.route("/").get(employeeController.getEmployees);
employeeRouter.route("/shop/:shopId").get(employeeController.getAllShopEmployee);
employeeRouter.route("/assign").post(checkEmployeeLimit, employeeController.assignEmployeeToShop);
employeeRouter.route("/remove").post(employeeController.removeEmployeeFromShop);

export default employeeRouter;