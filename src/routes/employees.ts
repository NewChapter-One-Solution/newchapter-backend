import { Router } from "express";

import * as employeeController from "../controllers/employeeController";

const employeeRouter = Router();

employeeRouter.route("/").get(employeeController.getEmployees);
employeeRouter.route("/shop/:shopId").get(employeeController.getAllShopEmployee);
employeeRouter.route("/assign").post(employeeController.assignEmployeeToShop);
employeeRouter.route("/remove").post(employeeController.removeEmployeeFromShop);

export default employeeRouter;