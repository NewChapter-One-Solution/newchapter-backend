import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import prisma from "../models/prisma-client";
import { Inventory } from "@prisma/client";
import { paginate } from "../utils/paginatedResponse";
import CustomError from "../utils/CustomError";

export const createInventory = asyncHandler(async (req: Request, res: Response) => {
    const { shopId, productId, quantity } = req.body;

    if (!shopId || !productId || !quantity) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await prisma.inventory.findFirst({
        where: {
            shopId: shopId,
            productId: productId
        },
    });

    if (existing) {
        return res.status(409).json({ message: 'Inventory already exists' });
    }

    const inventory: Inventory | null | any = await prisma.inventory.create({
        data: { shopId, productId, quantity } as any
    });

    res.status(201).json({ success: true, message: "Inventory created successfully", data: inventory });
});



export const adjustInventory = asyncHandler(async (req: Request, res: Response) => {
    const { shopId, productId, quantity, reason } = req.body;

    await prisma.inventory.updateMany({
        where: { shopId, productId },
        data: { quantity: { increment: quantity } },
    });

    await prisma.stockLog.create({
        data: {
            shopId,
            productId,
            changeType: 'MANUAL_ADJUSTMENT',
            quantity,
            reason,
        },
    });

    res.json({ success: true, message: 'Inventory adjusted' });
});

export const getInventoryByShopId = asyncHandler(async (req: Request, res: Response) => {
    const { shopId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const paginatedInventory = await paginate({
        model: 'inventory',
        page: Number(page),
        limit: Number(limit),
        where: { shopId },
        include: {
            product: {
                select: {
                    name: true,
                    color: true,
                    size: true,
                    category: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
            }
        },
    });

    const responseData = {
        invetories: paginatedInventory.data,
        meta: paginatedInventory.meta
    }

    res.status(200).json({ success: true, message: "inventory fetched successfully", data: responseData });
});

export const getLowStock = asyncHandler(async (req: Request, res: Response) => {

    const { page = 1, limit = 10, threshold = 5 } = req.query

    const { shopId } = req.params;

    if (!shopId) throw new CustomError('Shop ID is required', 400);

    const result = await paginate({
        model: "inventory",
        page: Number(page),
        limit: Number(limit),
        where: {
            shopId,
            quantity: {
                lt: Number(threshold),
            },
        },
        include: {
            product: {
                select: { name: true },
            },
            shop: {
                select: { name: true },
            },
        },
    });

    const responseData = {
        lowStockItems: result.data,
        meta: result.meta
    }

    res.status(200).json({ success: true, message: "low stocks fetched successfully", data: responseData });
});

export const getStockLogs = asyncHandler(async (req: Request, res: Response) => {
    const { shopId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!shopId) throw new CustomError('Shop ID is required', 400);

    const paginatedLogs = await paginate({
        model: "stockLog",
        page: Number(page),
        limit: Number(limit),
        where: { shopId },
        orderBy: { createdAt: "desc" },
        include: {
            product: {
                select: { name: true },
            },
        },
    });


    const responseData = {
        logs: paginatedLogs.data,
        meta: paginatedLogs.meta
    }

    res.status(200).json({ success: true, message: "stock logs fetched successfully", data: responseData });
});

export const getProductStockAcrossShops = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;

    const paginatedStocks = await paginate({
        model: "inventory",
        where: { productId },
        include: { shop: { select: { name: true } } },
    });

    const responseData = {
        stocks: paginatedStocks.data,
        meta: paginatedStocks.meta
    }


    res.status(200).json({ success: true, message: "inventory fetched successfully", data: responseData });
});
// Get low stock items with email notification status
// export const getLowStockItemsWithNotificationStatus = asyncHandler(
//     async (req: Request, res: Response) => {
//         const { shopId, threshold = 10 } = req.query;

//         const where: any = {
//             quantity: {
//                 lte: parseInt(threshold as string),
//             },
//         };

//         if (shopId) {
//             where.shopId = shopId as string;
//         }

//         const lowStockItems = await prisma.inventory.findMany({
//             where,
//             include: {
//                 product: {
//                     include: {
//                         category: {
//                             select: { name: true },
//                         },
//                     },
//                 },
//                 shop: {
//                     select: {
//                         name: true,
//                         location: true,
//                         ownerId: true,
//                     },
//                 },
//                 warehouse: {
//                     select: { name: true },
//                 },
//             },
//             orderBy: [
//                 { quantity: 'asc' },
//                 { shop: { name: 'asc' } },
//             ],
//         });

//         // Get notification recipients count
//         const recipients = await prisma.user.count({
//             where: {
//                 AND: [
//                     {
//                         role: {
//                             in: ['ADMIN', 'MANAGER'],
//                         },
//                     },
//                     {
//                         isActive: true,
//                     },
//                     {
//                         email: {
//                             not: null,
//                         },
//                     },
//                 ],
//             },
//         });

//         const summary = {
//             totalLowStockItems: lowStockItems.length,
//             outOfStockItems: lowStockItems.filter(item => item.quantity === 0).length,
//             criticalItems: lowStockItems.filter(item => item.quantity <= 5).length,
//             shopsAffected: new Set(lowStockItems.map(item => item.shopId)).size,
//             notificationRecipients: recipients,
//         };

//         res.status(200).json({
//             success: true,
//             message: "Low stock items retrieved successfully",
//             data: {
//                 summary,
//                 items: lowStockItems,
//                 threshold: parseInt(threshold as string),
//             },
//         });
//     }
// );