import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import prisma from "../models/prisma-client";
import { Inventory } from "@prisma/client";
import { paginate } from "../utils/paginatedResponse";
import CustomError from "../utils/CustomError";
import { lowStockEmailService } from "../services/lowStockEmailService";
import { lowStockCronJob } from "../jobs/lowStockCron";
import logger from "../utils/logger";

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


// Send low stock alert to specific shop owner
export const sendLowStockAlert = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { shopId } = req.params;
    const { threshold = 10 } = req.body;

    if (!shopId) {
        throw new CustomError('Shop ID is required', 400);
    }

    try {
        // Get low stock items for the specific shop
        const shopAlerts = await lowStockEmailService.getLowStockItemsByShop(threshold);
        const shopAlert = shopAlerts.find(alert => alert.shopId === shopId);

        if (!shopAlert) {
            res.status(200).json({
                success: true,
                message: 'No low stock items found for this shop',
                data: {
                    shopId,
                    lowStockItems: 0,
                    emailSent: false
                }
            });
            return;
        }

        if (!shopAlert.ownerEmail) {
            res.status(400).json({
                success: false,
                message: 'Shop owner has no email address configured',
                data: {
                    shopId,
                    shopName: shopAlert.shopName,
                    ownerEmail: null,
                    emailSent: false
                }
            });
            return;
        }

        const emailSent = await lowStockEmailService.sendLowStockAlert(shopAlert);

        res.status(200).json({
            success: true,
            message: emailSent ? 'Low stock alert sent successfully' : 'Failed to send low stock alert',
            data: {
                shopId,
                shopName: shopAlert.shopName,
                ownerEmail: shopAlert.ownerEmail,
                lowStockItems: shopAlert.totalItems,
                criticalItems: shopAlert.criticalItems,
                emailSent
            }
        });

    } catch (error) {
        logger.error(`Error sending low stock alert for shop ${shopId}:`, error);
        throw new CustomError('Failed to send low stock alert', 500);
    }
});

// Send low stock alerts to all shops
export const sendAllLowStockAlerts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { threshold = 10 } = req.body;

    try {
        const results = await lowStockEmailService.sendAllLowStockAlerts(threshold);

        res.status(200).json({
            success: true,
            message: 'Low stock alerts processing completed',
            data: {
                ...results,
                threshold,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Error sending all low stock alerts:', error);
        throw new CustomError('Failed to send low stock alerts', 500);
    }
});

// Get low stock summary for all shops
export const getLowStockSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { threshold = 10 } = req.query;

    try {
        const shopAlerts = await lowStockEmailService.getLowStockItemsByShop(Number(threshold));

        const summary = {
            totalShops: shopAlerts.length,
            totalLowStockItems: shopAlerts.reduce((sum, shop) => sum + shop.totalItems, 0),
            totalCriticalItems: shopAlerts.reduce((sum, shop) => sum + shop.criticalItems, 0),
            shopsWithoutEmail: shopAlerts.filter(shop => !shop.ownerEmail).length,
            threshold: Number(threshold),
            lastChecked: new Date().toISOString()
        };

        const shopsData = shopAlerts.map(shop => ({
            shopId: shop.shopId,
            shopName: shop.shopName,
            shopLocation: shop.shopLocation,
            ownerName: shop.ownerName,
            ownerEmail: shop.ownerEmail,
            hasEmail: !!shop.ownerEmail,
            totalItems: shop.totalItems,
            criticalItems: shop.criticalItems,
            lowItems: shop.lowItems
        }));

        res.status(200).json({
            success: true,
            message: 'Low stock summary retrieved successfully',
            data: {
                summary,
                shops: shopsData
            }
        });

    } catch (error) {
        logger.error('Error getting low stock summary:', error);
        throw new CustomError('Failed to get low stock summary', 500);
    }
});

// Trigger manual low stock check (admin only)
export const triggerLowStockCheck = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
        logger.info('Manual low stock check triggered by admin');

        // Run the low stock check
        await lowStockCronJob.triggerManualCheck();

        res.status(200).json({
            success: true,
            message: 'Low stock check completed successfully',
            data: {
                triggeredAt: new Date().toISOString(),
                triggeredBy: 'manual'
            }
        });

    } catch (error) {
        logger.error('Error in manual low stock check:', error);
        throw new CustomError('Failed to perform low stock check', 500);
    }
});

// Get low stock items with detailed information
export const getLowStockItemsDetailed = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { shopId, threshold = 10, page = 1, limit = 20 } = req.query;

    try {
        const where: any = {
            quantity: { lte: Number(threshold) }
        };

        if (shopId) {
            where.shopId = shopId as string;
        }

        const result = await paginate({
            model: "inventory",
            page: Number(page),
            limit: Number(limit),
            where,
            include: {
                product: {
                    select: {
                        name: true,
                        price: true,
                        description: true,
                        category: {
                            select: { name: true }
                        }
                    }
                },
                shop: {
                    select: {
                        name: true,
                        location: true,
                        ownerId: true
                    }
                },
                warehouse: {
                    select: { name: true }
                }
            },
            orderBy: [
                { quantity: 'asc' },
                { shop: { name: 'asc' } }
            ]
        });

        // Add status and urgency level to each item
        const itemsWithStatus = result.data.map((item: any) => {
            let status = 'Low Stock';
            let urgencyLevel = 'medium';

            if (item.quantity === 0) {
                status = 'Out of Stock';
                urgencyLevel = 'critical';
            } else if (item.quantity <= 2) {
                status = 'Critical';
                urgencyLevel = 'high';
            } else if (item.quantity <= 5) {
                status = 'Low';
                urgencyLevel = 'medium';
            }

            return {
                ...item,
                status,
                urgencyLevel,
                needsRestock: item.quantity <= 5
            };
        });

        const responseData = {
            items: itemsWithStatus,
            meta: result.meta,
            summary: {
                totalItems: result.meta.totalItems,
                outOfStock: itemsWithStatus.filter((item: any) => item.quantity === 0).length,
                critical: itemsWithStatus.filter((item: any) => item.quantity <= 2).length,
                low: itemsWithStatus.filter((item: any) => item.quantity <= 5 && item.quantity > 2).length,
                threshold: Number(threshold)
            }
        };

        res.status(200).json({
            success: true,
            message: "Low stock items retrieved successfully",
            data: responseData
        });

    } catch (error) {
        logger.error('Error getting detailed low stock items:', error);
        throw new CustomError('Failed to get low stock items', 500);
    }
});