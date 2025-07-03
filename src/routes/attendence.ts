
import { Router } from "express";
import * as attedenceController from "../controllers/attendenceController";
import jwtAuthMiddleware from "../core/jwtMiddleware";

const attendanceRouter = Router();

attendanceRouter.route("/checkin").post(jwtAuthMiddleware, attedenceController.checkIn);
attendanceRouter.route("/checkout").post(jwtAuthMiddleware, attedenceController.checkOut);

attendanceRouter.route("/report").get(jwtAuthMiddleware, attedenceController.reportById);

export default attendanceRouter;