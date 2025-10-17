import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { paginate } from '../utils/paginatedResponse';
import prisma from '../models/prisma-client';
import CustomError from '../utils/CustomError';
import { UserPayload } from '../types/jwtInterface';
import logger from '../utils/logger';

// Get all individual items for a product
export const getProductItems = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { page = 1, limit = 10, status, shopId, warehouseId } = req.query;

  const where: any = { productId };

  if (status) where.status = status;
  if (shopId) where.shopId = shopId;
  if (warehouseId) where.warehouseId = warehouseId;

  const items = await prisma.productItem.findMany({
    where,
    include: {
      product: {
        select: { name: true, price: true }
      },
      shop: {
        select: { name: true, location: true }
      },
      warehouse: {
        select: { name: true, location: true }
      }
    },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    orderBy: { createdAt: 'desc' }
  });

  const total = await prisma.productItem.count({ where });

  const responseData = {
    items: items,
    meta: {
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      totalItems: total,
      itemsPerPage: Number(limit),
      hasNextPage: Number(page) < Math.ceil(total / Number(limit)),
      hasPrevPage: Number(page) > 1
    }
  };

  res.json({
    success: true,
    message: 'Product items retrieved successfully',
    data: responseData
  });
});

// Get individual item details with history
export const getProductItemDetails = asyncHandler(async (req: Request, res: Response) => {
  const { itemId } = req.params;

  const item = await prisma.productItem.findUnique({
    where: { id: itemId },
    include: {
      product: true,
      shop: true,
      warehouse: true,
      purchase: true,
      sale: true,
      itemHistory: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!item) {
    return res.status(404).json({
      success: false,
      message: 'Product item not found'
    });
  }

  res.json({
    success: true,
    data: item
  });
});

// Move item between locations
export const moveProductItem = asyncHandler(async (req: Request, res: Response) => {
  const { itemId } = req.params;
  const { toShopId, toWarehouseId, reason } = req.body;
  const userId = req.user?.id;

  const item = await prisma.productItem.findUnique({
    where: { id: itemId },
    include: { shop: true, warehouse: true }
  });

  if (!item) {
    return res.status(404).json({
      success: false,
      message: 'Product item not found'
    });
  }

  const fromLocation = item.shop?.name || item.warehouse?.name || 'Unknown';

  // Update item location
  const updatedItem = await prisma.productItem.update({
    where: { id: itemId },
    data: {
      shopId: toShopId,
      warehouseId: toWarehouseId
    }
  });

  // Get new location name
  const newLocation = toShopId
    ? (await prisma.shop.findUnique({ where: { id: toShopId } }))?.name
    : (await prisma.warehouses.findUnique({ where: { id: toWarehouseId } }))?.name;

  // Create history record
  await prisma.productItemHistory.create({
    data: {
      productItemId: itemId,
      action: 'MOVED',
      fromLocation,
      toLocation: newLocation || 'Unknown',
      reason: reason || 'Location transfer',
      performedBy: userId
    }
  });

  res.json({
    success: true,
    message: 'Item moved successfully',
    data: updatedItem
  });
});

// Update item status
export const updateProductItemStatus = asyncHandler(async (req: Request, res: Response) => {
  const { itemId } = req.params;
  const { status, condition, reason } = req.body;
  const userId = req.user?.id;

  const item = await prisma.productItem.findUnique({
    where: { id: itemId }
  });

  if (!item) {
    return res.status(404).json({
      success: false,
      message: 'Product item not found'
    });
  }

  const updatedItem = await prisma.productItem.update({
    where: { id: itemId },
    data: {
      ...(status && { status }),
      ...(condition && { condition })
    }
  });

  // Create history record
  await prisma.productItemHistory.create({
    data: {
      productItemId: itemId,
      action: 'STATUS_UPDATED',
      fromStatus: item.status,
      toStatus: status || item.status,
      reason: reason || 'Status update',
      performedBy: userId
    }
  });

  res.json({
    success: true,
    message: 'Item status updated successfully',
    data: updatedItem
  });
});

// Enhanced purchase receiving - creates individual items
export const receivePurchaseWithItems = asyncHandler(async (req: Request, res: Response) => {
  const { purchaseId } = req.params;
  const { items } = req.body; // Array of { purchaseItemId, receivedQty, serialNumbers? }

  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: { purchaseItems: true }
  });

  if (!purchase) {
    return res.status(404).json({
      success: false,
      message: 'Purchase not found'
    });
  }

  const createdItems = [];

  for (const item of items) {
    const purchaseItem = purchase.purchaseItems.find(pi => pi.id === item.purchaseItemId);
    if (!purchaseItem) continue;

    // Create individual items for each received quantity
    for (let i = 0; i < item.receivedQty; i++) {
      const productItem = await prisma.productItem.create({
        data: {
          productId: purchaseItem.productId,
          purchaseId: purchaseId,
          purchaseItemId: item.purchaseItemId,
          purchasePrice: purchaseItem.unitPrice,
          purchaseDate: new Date(),
          shopId: purchase.shopId,
          status: 'AVAILABLE',
          condition: 'NEW',
          serialNumber: item.serialNumbers?.[i], // Optional serial number
          barcode: `${purchaseItem.productId}-${Date.now()}-${i}` // Auto-generated barcode
        }
      });

      // Create history record
      await prisma.productItemHistory.create({
        data: {
          productItemId: productItem.id,
          action: 'RECEIVED',
          toLocation: purchase.shop?.name || 'Shop',
          toStatus: 'AVAILABLE',
          reason: `Received from purchase ${purchase.id}`,
          performedBy: req.user?.id
        }
      });

      createdItems.push(productItem);
    }

    // Update purchase item received quantity
    await prisma.purchaseItem.update({
      where: { id: item.purchaseItemId },
      data: {
        receivedQty: { increment: item.receivedQty }
      }
    });

    // Update inventory (for backward compatibility)
    await prisma.inventory.upsert({
      where: {
        shopId_productId: {
          shopId: purchase.shopId,
          productId: purchaseItem.productId
        }
      },
      update: {
        quantity: { increment: item.receivedQty }
      },
      create: {
        shopId: purchase.shopId,
        productId: purchaseItem.productId,
        warehouseId: purchase.shop?.Inventory[0]?.warehouseId || '', // Default warehouse
        quantity: item.receivedQty
      }
    });
  }

  res.json({
    success: true,
    message: 'Purchase received and individual items created',
    data: {
      createdItemsCount: createdItems.length,
      items: createdItems
    }
  });
});

// Enhanced sales processing - sells specific individual items
export const processSaleWithItems = asyncHandler(async (req: Request, res: Response) => {
  const { saleData } = req.body;
  // saleData: { shopId, customerId, paymentMode, items: [{ productId, quantity, unitPrice, specificItemIds? }] }

  const sale = await prisma.sales.create({
    data: {
      shopId: saleData.shopId,
      customerId: saleData.customerId,
      paymentMode: saleData.paymentMode,
      totalAmount: saleData.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0),
      invoiceNo: `INV-${Date.now()}`
    }
  });

  const soldItems = [];

  for (const item of saleData.items) {
    // Create sale item
    const saleItem = await prisma.saleItem.create({
      data: {
        saleId: sale.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }
    });

    let itemsToSell;

    if (item.specificItemIds) {
      // Sell specific items by ID
      itemsToSell = await prisma.productItem.findMany({
        where: {
          id: { in: item.specificItemIds },
          status: 'AVAILABLE'
        }
      });
    } else {
      // Find available items automatically (FIFO)
      itemsToSell = await prisma.productItem.findMany({
        where: {
          productId: item.productId,
          shopId: saleData.shopId,
          status: 'AVAILABLE'
        },
        take: item.quantity,
        orderBy: { createdAt: 'asc' } // FIFO
      });
    }

    if (itemsToSell.length < item.quantity) {
      throw new Error(`Insufficient stock for product ${item.productId}`);
    }

    // Mark items as sold
    for (const productItem of itemsToSell) {
      const updatedItem = await prisma.productItem.update({
        where: { id: productItem.id },
        data: {
          status: 'SOLD',
          saleId: sale.id,
          saleItemId: saleItem.id,
          salePrice: item.unitPrice,
          saleDate: new Date()
        }
      });

      // Create history record
      await prisma.productItemHistory.create({
        data: {
          productItemId: productItem.id,
          action: 'SOLD',
          fromStatus: 'AVAILABLE',
          toStatus: 'SOLD',
          reason: `Sold in invoice ${sale.invoiceNo}`,
          performedBy: req.user?.id
        }
      });

      soldItems.push(updatedItem);
    }

    // Update inventory (for backward compatibility)
    await prisma.inventory.update({
      where: {
        shopId_productId: {
          shopId: saleData.shopId,
          productId: item.productId
        }
      },
      data: {
        quantity: { decrement: item.quantity }
      }
    });
  }

  res.json({
    success: true,
    message: 'Sale processed with individual item tracking',
    data: {
      sale,
      soldItemsCount: soldItems.length,
      soldItems
    }
  });
});