import { Request, Response } from 'express';
import prisma from '../models/prisma-client';
import asyncHandler from '../utils/asyncHandler';
import CustomError from '../utils/CustomError';

export const createPurchase = asyncHandler(async (req: Request, res: Response) => {
    if (!req.body) throw new Error('Valid payload is required');

    const { shopId, supplierId, items } = req.body;
    if (!shopId || !supplierId || !items || items.length === 0) {
        throw new CustomError('Missing required fields', 400);
    }

    const totalAmount = items.reduce((acc: number, item: any) => acc + item.quantity * item.unitPrice, 0);

    const purchase = await prisma.purchase.create({
        data: {
            shopId,
            supplierId,
            totalAmount,
            status: 'RECEIVED',
            purchaseItems: {
                create: items.map((item: any) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    receivedQty: item.quantity,
                })),
            },
        },
        include: { purchaseItems: true },
    });

    for (const item of items) {
        if (!item.warehouseId) {
            throw new CustomError(`Missing warehouseId for productId: ${item.productId}`, 400);
        }

        await prisma.inventory.upsert({
            where: { shopId_productId: { shopId, productId: item.productId } as any },
            update: { quantity: { increment: item.quantity } },
            create: { shopId, productId: item.productId, quantity: item.quantity, warehouseId: item.warehouseId } as any,
        });

        await prisma.stockLog.create({
            data: {
                shopId,
                productId: item.productId,
                changeType: 'PURCHASE_IN',
                quantity: item.quantity,
                reason: 'New Purchase',
            },
        });
    }

    res.status(201).json({ success: true, message: 'Purchase created successfully', data: purchase });
});

export const returnPurchaseItem = asyncHandler(async (req: Request, res: Response) => {
    const { purchaseId, productId, quantity, shopId, reason } = req.body;

    await prisma.purchaseItem.updateMany({
        where: { purchaseId, productId },
        data: {
            returnedQty: { increment: quantity },
            receivedQty: { decrement: quantity },
        },
    });

    await prisma.inventory.updateMany({
        where: { shopId, productId },
        data: { quantity: { decrement: quantity } },
    });

    await prisma.stockLog.create({
        data: {
            shopId,
            productId,
            changeType: 'RETURN_TO_SUPPLIER',
            quantity: -quantity,
            reason,
        },
    });

    res.status(200).json({ success: true, message: `${quantity} defective items returned to supplier` });
});
