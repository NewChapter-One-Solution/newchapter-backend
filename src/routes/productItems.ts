import express from 'express';
import {
  getProductItems,
  getProductItemDetails,
  moveProductItem,
  updateProductItemStatus,
  receivePurchaseWithItems,
  processSaleWithItems
} from '../controllers/productItemController';
import jwtAuthMiddleware from '../middleware/jwtMiddleware';
import { requirePermissions, requireRole, PERMISSIONS } from '../middleware/rbacMiddleware';
import { Role } from '@prisma/client';

const router = express.Router();

// All routes require authentication
router.use(jwtAuthMiddleware);

// Get all individual items for a product (All authenticated users)
router.get('/product/:productId/items',
  requirePermissions([PERMISSIONS.INVENTORY_READ]),
  getProductItems
);

// Get individual item details with history (All authenticated users)
router.get('/:itemId',
  requirePermissions([PERMISSIONS.INVENTORY_READ]),
  getProductItemDetails
);

// Move item between locations (Manager/Admin only)
router.patch('/:itemId/move',
  requirePermissions([PERMISSIONS.INVENTORY_UPDATE]),
  moveProductItem
);

// Update item status (Manager/Admin only)
router.patch('/:itemId/status',
  requirePermissions([PERMISSIONS.INVENTORY_UPDATE]),
  updateProductItemStatus
);

// Enhanced purchase receiving with individual item creation (Manager/Admin only)
router.post('/purchase/:purchaseId/receive',
  requirePermissions([PERMISSIONS.PURCHASE_UPDATE]),
  receivePurchaseWithItems
);

// Enhanced sales processing with individual item tracking (All can create sales)
router.post('/sales/process',
  requirePermissions([PERMISSIONS.SALES_CREATE]),
  processSaleWithItems
);

export default router;