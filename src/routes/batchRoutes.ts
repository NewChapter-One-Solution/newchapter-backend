import { Router } from 'express';
import {
  getProductBatches,
  getBatchByNumber,
  getBatchesNearingExpiry,
  getBatchHistory,
} from '../controllers/batchController';

const router = Router();

// Get all batches for a product
router.get('/product/:productId', getProductBatches);

// Get batch by batch number
router.get('/number/:batchNumber', getBatchByNumber);

// Get batches nearing expiry
router.get('/expiring', getBatchesNearingExpiry);

// Get batch history/movements
router.get('/:batchId/history', getBatchHistory);

export default router;