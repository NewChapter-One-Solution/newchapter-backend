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
import commentsRouter from "./comments";
import purchaseRouter from "./purchase";
import inventoryRouter from "./inventory";
import adminRouter from "./admin";
import salesRouter from "./sales";
import customerRouter from "./customers";
import reportsRouter from "./reports";
import invoiceRouter from "./invoices";
import healthRouter from "./health";

const router = Router();

// Use routes
router.use("/auth", authRoutes);
router.use("/users", userRouter);
router.use("/warehouses", warehouseRouter);
router.use("/categories", categoryRouter);
router.use("/suppliers", supplierRouter);
router.use("/inventory", inventoryRouter);
router.use("/attendence", attendanceRouter);
router.use("/shops", shopRouter);
router.use("/employees", employeeRouter);
router.use("/products", productRouter);
router.use("/comments", commentsRouter);
router.use("/purchases", purchaseRouter);
router.use("/sales", salesRouter);
router.use("/customers", customerRouter);
router.use("/reports", reportsRouter);
router.use("/invoices", invoiceRouter);
router.use("/", healthRouter); // Health routes at root level
// router.use("/demo", demoRouter);
router.use("/admin", adminRouter);

export default router;
