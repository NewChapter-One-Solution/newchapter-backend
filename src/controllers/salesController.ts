import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/asyncHandler";
import CustomError from "../utils/CustomError";
import prisma from "../models/prisma-client";
import { UserPayload } from "../types/jwtInterface";
import { paginate } from "../utils/paginatedResponse";
import { getNextAvailableInvoiceNumber, calculateInvoiceTotals } from "../utils/invoiceUtils";
import { getAvailableBatches, updateBatchQuantity } from "./batchController";

// Define interface for sale item
interface SaleItemData {
  productId: string;
  quantity: number;
  unitPrice: number;
}

// Interface for batch allocation
interface BatchAllocation {
  batchId: string;
  quantity: number;
  unitPrice: number;
}

// Helper function to allocate inventory using FIFO batch system
async function allocateInventoryFromBatches(
  shopId: string,
  productId: string,
  requiredQuantity: number
): Promise<BatchAllocation[]> {
  const availableBatches = await getAvailableBatches(productId, shopId);

  if (availableBatches.length === 0) {
    throw new CustomError(`No batches available for product`, 400);
  }

  const allocations: BatchAllocation[] = [];
  let remainingQuantity = requiredQuantity;

  for (const batch of availableBatches) {
    if (remainingQuantity <= 0) break;

    const allocateFromBatch = Math.min(remainingQuantity, batch.remainingQty);

    allocations.push({
      batchId: batch.id,
      quantity: allocateFromBatch,
      unitPrice: batch.unitPrice,
    });

    remainingQuantity -= allocateFromBatch;
  }

  if (remainingQuantity > 0) {
    throw new CustomError(`Insufficient inventory. Need ${remainingQuantity} more units`, 400);
  }

  return allocations;
}

// Create a new sale
export const createSale = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { shopId, customerId, items, paymentMode, discount = 0 } = req.body;
    const user = req.user as UserPayload;

    if (!shopId || !customerId || !items || !Array.isArray(items) || items.length === 0) {
      throw new CustomError("Shop ID, customer ID, and items are required", 400);
    }

    if (!paymentMode) {
      throw new CustomError("Payment mode is required", 400);
    }

    // Validate shop exists
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      throw new CustomError("Shop not found", 404);
    }

    // Validate customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new CustomError("Customer not found", 404);
    }

    // Calculate total amount and validate inventory with batch allocation
    let totalAmount = 0;
    const saleItems: SaleItemData[] = [];
    const batchAllocations: { [productId: string]: BatchAllocation[] } = {};

    for (const item of items) {
      const { productId, quantity, unitPrice } = item;

      if (!productId || !quantity || !unitPrice) {
        throw new CustomError("Each item must have productId, quantity, and unitPrice", 400);
      }

      // Check if product exists
      const product = await prisma.products.findUnique({ where: { id: productId } });
      if (!product) {
        throw new CustomError(`Product with ID ${productId} not found`, 404);
      }

      // Check inventory availability
      const inventory = await prisma.inventory.findUnique({
        where: { shopId_productId: { shopId, productId } }
      });

      if (!inventory || inventory.quantity < quantity) {
        throw new CustomError(`Insufficient inventory for product: ${product.name}`, 400);
      }

      // Allocate inventory from batches using FIFO
      const allocations = await allocateInventoryFromBatches(shopId, productId, quantity);
      batchAllocations[productId] = allocations;

      totalAmount += quantity * unitPrice;
      saleItems.push({
        productId,
        quantity,
        unitPrice,
      });
    }

    // Apply discount
    totalAmount = totalAmount - (totalAmount * discount / 100);

    // Generate unique invoice number
    const invoiceNo = await getNextAvailableInvoiceNumber();

    // Create sale with transaction
    const sale = await prisma.$transaction(async (tx) => {
      // Create the sale
      const newSale = await tx.sales.create({
        data: {
          shopId,
          customerId,
          totalAmount,
          paymentMode,
          invoiceNo,
          saleItems: {
            create: saleItems,
          },
        },
        include: {
          saleItems: {
            include: {
              product: {
                select: {
                  name: true,
                  price: true,
                },
              },
            },
          },
          customer: {
            select: {
              name: true,
              phone: true,
              email: true,
            },
          },
          shop: {
            select: {
              name: true,
              location: true,
            },
          },
        },
      });

      // Update inventory and batches for each item
      for (const item of saleItems) {
        const allocations = batchAllocations[item.productId];

        // Update inventory
        await tx.inventory.update({
          where: { shopId_productId: { shopId, productId: item.productId } },
          data: { quantity: { decrement: item.quantity } },
        });

        // Update each batch and create stock logs
        for (const allocation of allocations) {
          // Update batch remaining quantity
          await tx.productBatch.update({
            where: { id: allocation.batchId },
            data: { remainingQty: { decrement: allocation.quantity } },
          });

          // Create stock log entry for each batch
          await tx.stockLog.create({
            data: {
              productId: item.productId,
              shopId,
              changeType: "SALE_OUT",
              quantity: -allocation.quantity,
              reason: `Sale - Invoice: ${invoiceNo}`,
              batchId: allocation.batchId,
            },
          });
        }
      }

      return newSale;
    });

    // Calculate invoice summary for response
    const invoiceCalculation = calculateInvoiceTotals(saleItems, discount);

    res.status(201).json({
      success: true,
      message: "Sale created successfully and invoice generated",
      data: {
        ...sale,
        invoiceDetails: {
          ...invoiceCalculation,
          invoiceNumber: invoiceNo,
          invoiceUrl: `/api/v1/invoices/print/${sale.id}`,
          printUrl: `/api/v1/invoices/print/${sale.id}`,
        },
      },
    });
  }
);

// Get all sales with pagination and filtering
export const getAllSales = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { page = 1, limit = 10, shopId, startDate, endDate, paymentMode } = req.query;

    const where: any = {};

    if (shopId) {
      where.shopId = shopId as string;
    }

    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) {
        where.saleDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999); // Include entire day
        where.saleDate.lte = end;
      }
    }


    if (paymentMode) {
      where.paymentMode = paymentMode;
    }

    const sales = await paginate({
      model: "sales",
      page: Number(page),
      limit: Number(limit),
      where,
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
        shop: {
          select: {
            name: true,
          },
        },
        saleItems: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { saleDate: "desc" },
    });


    const responseData = {
      sales: sales.data,
      meta: sales.meta
    }

    res.status(200).json({
      success: true,
      message: "Sales retrieved successfully",
      data: responseData,
    });
  }
);

// Get sale by ID
export const getSaleById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      throw new CustomError("Sale ID is required", 400);
    }

    const sale = await prisma.sales.findUnique({
      where: { id },
      include: {
        saleItems: {
          include: {
            product: {
              select: {
                name: true,
                price: true,
                description: true,
              },
            },
          },
        },
        customer: true,
        shop: {
          select: {
            name: true,
            location: true,
          },
        },
      },
    });

    if (!sale) {
      throw new CustomError("Sale not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Sale retrieved successfully",
      data: sale,
    });
  }
);

// Get sales by shop
export const getSalesByShop = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { shopId } = req.params;
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    if (!shopId) {
      throw new CustomError("Shop ID is required", 400);
    }

    const where: any = { shopId };

    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) {
        where.saleDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.saleDate.lte = new Date(endDate as string);
      }
    }

    const sales = await paginate({
      model: "sales",
      page: Number(page),
      limit: Number(limit),
      where,
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
        saleItems: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { saleDate: "desc" },
    });

    const responseData = {
      sales: sales.data,
      meta: sales.meta
    }

    res.status(200).json({
      success: true,
      message: "Shop sales retrieved successfully",
      data: responseData,
    });
  }
);

// Get sales analytics
export const getSalesAnalytics = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { shopId, period = "month" } = req.query;

    const now = new Date();
    let dateFilter: any = {};

    switch (period) {
      case "day":
        dateFilter = { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) };
        break;
      case "week":
        const weekStart = new Date();
        weekStart.setDate(now.getDate() - (now.getDay() || 7) + 1); // Start on Monday
        dateFilter = { gte: weekStart };
        break;
      case "month":
        dateFilter = { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
        break;
      case "year":
        dateFilter = { gte: new Date(now.getFullYear(), 0, 1) };
        break;
    }

    const where: any = { saleDate: dateFilter };
    if (shopId) where.shopId = shopId as string;

    const [totalSales, totalRevenue, filteredSales] = await Promise.all([
      prisma.sales.count({ where }),
      prisma.sales.aggregate({ where, _sum: { totalAmount: true } }),
      prisma.sales.findMany({ where, select: { id: true } }),
    ]);

    const saleIds = filteredSales.map(s => s.id);

    const topProducts = await prisma.saleItem.groupBy({
      by: ["productId"],
      where: {
        saleId: { in: saleIds },
      },
      _sum: { quantity: true },
      _count: { productId: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });

    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.products.findUnique({
          where: { id: item.productId },
          select: { name: true, price: true },
        });
        return {
          product,
          totalQuantitySold: item._sum.quantity || 0,
          totalSales: item._count.productId,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Sales analytics retrieved successfully",
      data: {
        totalSales,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        topProducts: topProductsWithDetails,
        period,
      },
    });
  }
);
