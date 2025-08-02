import { Router } from "express";
import * as invoiceController from "../controllers/invoiceController";
import jwtAuthMiddleware from "../middleware/jwtMiddleware";
import { requirePermissions, PERMISSIONS } from "../middleware/rbacMiddleware";

const invoiceRouter = Router();

// All routes require authentication
invoiceRouter.use(jwtAuthMiddleware);

// Invoice management routes
invoiceRouter.get("/",
  requirePermissions([PERMISSIONS.SALES_READ]),
  invoiceController.getAllInvoices
);

invoiceRouter.get("/statistics",
  requirePermissions([PERMISSIONS.REPORTS_VIEW]),
  invoiceController.getInvoiceStatistics
);

invoiceRouter.get("/sale/:saleId",
  requirePermissions([PERMISSIONS.SALES_READ]),
  invoiceController.getInvoiceBySaleId
);

invoiceRouter.get("/number/:invoiceNo",
  requirePermissions([PERMISSIONS.SALES_READ]),
  invoiceController.getInvoiceByNumber
);

invoiceRouter.get("/print/:saleId",
  requirePermissions([PERMISSIONS.SALES_READ]),
  invoiceController.generateInvoiceHTML
);

export default invoiceRouter;