import { Request, Response } from 'express';
import prisma from '../models/prisma-client';
import asyncHandler from '../utils/asyncHandler';
import CustomError from '../utils/CustomError';

// ===== BATCH SERVICE FUNCTIONS =====

/**
 * Generate a unique batch number
 */
export const generateBatchNumber = async (): Promise<string> => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BATCH-${timestamp}-${random}`;
};

/**
 * Create a new product batch
 */
export const createBatch = async (data: {
  purchaseId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  supplierBatchId?: string;
  expiryDate?: Date;
  manufacturingDate?: Date;
}) => {
  const batchNumber = await generateBatchNumber();

  return await prisma.productBatch.create({
    data: {
      batchNumber,
      supplierBatchId: data.supplierBatchId,
      purchaseId: data.purchaseId,
      productId: data.productId,
      quantity: data.quantity,
      remainingQty: data.quantity,
      unitPrice: data.unitPrice,
      expiryDate: data.expiryDate,
      manufacturingDate: data.manufacturingDate,
    },
    include: {
      product: true,
      purchase: true,
    },
  });
};

/**
 * Get batches for a product with remaining quantity
 */
export const getAvailableBatches = async (productId: string, shopId?: string) => {
  return await prisma.productBatch.findMany({
    where: {
      productId,
      remainingQty: { gt: 0 },
      ...(shopId && {
        purchase: {
          shopId,
        },
      }),
    },
    include: {
      product: true,
      purchase: {
        include: {
          shop: true,
          Suppliers: true,
        },
      },
    },
    orderBy: [
      { expiryDate: 'asc' }, // FIFO by expiry date
      { createdAt: 'asc' }, // Then by creation date
    ],
  });
};

/**
 * Update batch quantity (for sales/returns)
 */
export const updateBatchQuantity = async (batchId: string, quantityChange: number) => {
  const batch = await prisma.productBatch.findUnique({
    where: { id: batchId },
  });

  if (!batch) {
    throw new CustomError('Batch not found', 404);
  }

  const newRemainingQty = batch.remainingQty + quantityChange;

  if (newRemainingQty < 0) {
    throw new CustomError('Insufficient batch quantity', 400);
  }

  return await prisma.productBatch.update({
    where: { id: batchId },
    data: { remainingQty: newRemainingQty },
  });
};

/**
 * Get batch details by batch number
 */
export const getBatchByNumberService = async (batchNumber: string) => {
  return await prisma.productBatch.findUnique({
    where: { batchNumber },
    include: {
      product: true,
      purchase: {
        include: {
          shop: true,
          Suppliers: true,
        },
      },
    },
  });
};

/**
 * Get batches nearing expiry
 */
export const getBatchesNearingExpiryService = async (days: number = 30) => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return await prisma.productBatch.findMany({
    where: {
      expiryDate: {
        lte: futureDate,
        gte: new Date(),
      },
      remainingQty: { gt: 0 },
    },
    include: {
      product: true,
      purchase: {
        include: {
          shop: true,
          Suppliers: true,
        },
      },
    },
    orderBy: { expiryDate: 'asc' },
  });
};

// ===== CONTROLLER FUNCTIONS =====

// Get all batches for a product
export const getProductBatches = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { shopId } = req.query;

  const batches = await getAvailableBatches(
    productId,
    shopId ? String(shopId) : undefined
  );

  res.status(200).json({
    success: true,
    data: batches,
  });
});

// Get batch by batch number
export const getBatchByNumber = asyncHandler(async (req: Request, res: Response) => {
  const { batchNumber } = req.params;

  const batch = await getBatchByNumberService(batchNumber);

  if (!batch) {
    throw new CustomError('Batch not found', 404);
  }

  res.status(200).json({
    success: true,
    data: batch,
  });
});

// Get batches nearing expiry
export const getBatchesNearingExpiry = asyncHandler(async (req: Request, res: Response) => {
  const { days = 30 } = req.query;

  const batches = await getBatchesNearingExpiryService(Number(days));

  res.status(200).json({
    success: true,
    data: batches,
    message: `Found ${batches.length} batches expiring within ${days} days`,
  });
});

// Get batch history/movements
export const getBatchHistory = asyncHandler(async (req: Request, res: Response) => {
  const { batchId } = req.params;

  const stockLogs = await prisma.stockLog.findMany({
    where: { batchId },
    include: {
      product: true,
      shop: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: stockLogs,
  });
});