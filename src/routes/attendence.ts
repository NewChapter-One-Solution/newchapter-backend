
import { Router } from "express";
import * as attedenceController from "../controllers/attendenceController";
import jwtAuthMiddleware from "../middleware/jwtMiddleware";

const attendanceRouter = Router();

attendanceRouter.route("/checkin").post(jwtAuthMiddleware, attedenceController.checkIn);
attendanceRouter.route("/checkout").post(jwtAuthMiddleware, attedenceController.checkOut);

attendanceRouter.route("/report/:userId").get(jwtAuthMiddleware, attedenceController.reportById);

export default attendanceRouter;