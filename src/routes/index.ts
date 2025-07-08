import { Router } from "express";

// Import routes
import authRoutes from "./auth";
import categoryRouter from "./categories";
import userRouter from "./user";
import warehouseRouter from "./warehouse";
import supplierRouter from "./suppliers";
import attendanceRouter from "./attendence";
import shopRouter from "./shops";
import employeeRouter from "./employees";
import productRouter from "./products";

const router = Router();

// Use routes
router.use("/auth", authRoutes);
router.use("/users", userRouter);
router.use("/warehouses", warehouseRouter);
router.use("/categories", categoryRouter);
router.use("/suppliers", supplierRouter);

router.use("/attendence", attendanceRouter);
router.use("/shops", shopRouter);
router.use("/employees", employeeRouter);
router.use("/products", productRouter);

export default router;
