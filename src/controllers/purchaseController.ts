import { Request, Response } from 'express';
import prisma from '../models/prisma-client';
import asyncHandler from '../utils/asyncHandler';
import CustomError from '../utils/CustomError';
import { createBatch, updateBatchQuantity } from './batchController';

export const createPurchase = asyncHandler(async (req: Request, res: Response) => {
    if (!req.body) throw new Error('Valid payload is required');

    const { shopId, supplierId, items, supplierBatchId } = req.body;
    if (!shopId || !supplierId || !items || items.length === 0) {
        throw new CustomError('Missing required fields', 400);
    }

    const totalAmount = items.reduce((acc: number, item: any) => acc + item.quantity * item.unitPrice, 0);

    // Create purchase with batch information
    const purchase = await prisma.purchase.create({
        data: {
            shopId,
            supplierId,
            totalAmount,
            status: 'RECEIVED',
            batchId: supplierBatchId, // External batch ID from supplier
            purchaseItems: {
                create: items.map((item: any) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    receivedQty: item.quantity,
                })),
            },
        },
        include: {
            purchaseItems: true,
            batches: true,
        },
    });

    // Create batches and update inventory for each item
    for (const item of items) {
        if (!item.warehouseId) {
            throw new CustomError(`Missing warehouseId for productId: ${item.productId}`, 400);
        }

        // Create batch for this item
        const batch = await createBatch({
            purchaseId: purchase.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            supplierBatchId: supplierBatchId,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
            manufacturingDate: item.manufacturingDate ? new Date(item.manufacturingDate) : undefined,
        });

        // Update purchase item with batch ID
        await prisma.purchaseItem.update({
            where: {
                purchaseId_productId: {
                    purchaseId: purchase.id,
                    productId: item.productId,
                },
            },
            data: { batchId: batch.id },
        });

        // Update inventory
        await prisma.inventory.upsert({
            where: { shopId_productId: { shopId, productId: item.productId } as any },
            update: { quantity: { increment: item.quantity } },
            create: { shopId, productId: item.productId, quantity: item.quantity, warehouseId: item.warehouseId } as any,
        });

        // Create stock log with batch reference
        await prisma.stockLog.create({
            data: {
                shopId,
                productId: item.productId,
                changeType: 'PURCHASE_IN',
                quantity: item.quantity,
                reason: 'New Purchase',
                batchId: batch.id,
            },
        });
    }

    // Fetch updated purchase with all relations
    const updatedPurchase = await prisma.purchase.findUnique({
        where: { id: purchase.id },
        include: {
            purchaseItems: {
                include: {
                    batch: true,
                    product: true,
                },
            },
            batches: {
                include: {
                    product: true,
                },
            },
            Suppliers: true,
            shop: true,
        },
    });

    res.status(201).json({
        success: true,
        message: 'Purchase created successfully with batch tracking',
        data: updatedPurchase
    });
});

export const returnPurchaseItem = asyncHandler(async (req: Request, res: Response) => {
    const { purchaseId, productId, quantity, shopId, reason, batchId } = req.body;

    if (!batchId) {
        throw new CustomError('Batch ID is required for returns', 400);
    }

    // Update purchase item
    await prisma.purchaseItem.updateMany({
        where: { purchaseId, productId },
        data: {
            returnedQty: { increment: quantity },
            receivedQty: { decrement: quantity },
        },
    });

    // Update batch quantity
    await updateBatchQuantity(batchId, -quantity);

    // Update inventory
    await prisma.inventory.updateMany({
        where: { shopId, productId },
        data: { quantity: { decrement: quantity } },
    });

    // Create stock log with batch reference
    await prisma.stockLog.create({
        data: {
            shopId,
            productId,
            changeType: 'RETURN_TO_SUPPLIER',
            quantity: -quantity,
            reason,
            batchId,
        },
    });

    res.status(200).json({
        success: true,
        message: `${quantity} items from batch returned to supplier`
    });
});

// Get all purchases with batch information
export const getPurchases = asyncHandler(async (req: Request, res: Response) => {
    const { shopId, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const purchases = await prisma.purchase.findMany({
        where: shopId ? { shopId: String(shopId) } : {},
        include: {
            purchaseItems: {
                include: {
                    batch: true,
                    product: true,
                },
            },
            batches: {
                include: {
                    product: true,
                },
            },
            Suppliers: true,
            shop: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
    });

    const total = await prisma.purchase.count({
        where: shopId ? { shopId: String(shopId) } : {},
    });

    res.status(200).json({
        success: true,
        data: purchases,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
        },
    });
});

// Get purchase by ID with batch details
export const getPurchaseById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const purchase = await prisma.purchase.findUnique({
        where: { id },
        include: {
            purchaseItems: {
                include: {
                    batch: true,
                    product: true,
                },
            },
            batches: {
                include: {
                    product: true,
                },
            },
            Suppliers: true,
            shop: true,
        },
    });

    if (!purchase) {
        throw new CustomError('Purchase not found', 404);
    }

    res.status(200).json({
        success: true,
        data: purchase,
    });
});
