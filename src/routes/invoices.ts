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

// Email-related routes
invoiceRouter.post("/email/:saleId",
  requirePermissions([PERMISSIONS.SALES_UPDATE]),
  invoiceController.sendInvoiceEmail
);

invoiceRouter.post("/email/:saleId/resend",
  requirePermissions([PERMISSIONS.SALES_UPDATE]),
  invoiceController.resendInvoiceEmail
);

invoiceRouter.post("/email/:saleId/reminder",
  requirePermissions([PERMISSIONS.SALES_UPDATE]),
  invoiceController.sendInvoiceReminder
);

invoiceRouter.get("/email/:saleId/status",
  requirePermissions([PERMISSIONS.SALES_READ]),
  invoiceController.getEmailStatus
);

export default invoiceRouter;