import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/asyncHandler";
import CustomError from "../utils/CustomError";
import prisma from "../models/prisma-client";
import { UserPayload } from "../types/jwtInterface";

// Get comprehensive business dashboard
export const getBusinessDashboard = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { shopId, period = "month" } = req.query;

    let dateFilter: any = {};
    const now = new Date();

    switch (period) {
      case "day":
        dateFilter = {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        };
        break;
      case "week":
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        dateFilter = { gte: weekStart };
        break;
      case "month":
        dateFilter = {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
        };
        break;
      case "year":
        dateFilter = {
          gte: new Date(now.getFullYear(), 0, 1),
        };
        break;
    }

    const where: any = { saleDate: dateFilter };
    if (shopId) {
      where.shopId = shopId as string;
    }

    const [
      totalRevenue,
      totalSales,
      totalCustomers,
      averageOrderValue,
      topSellingProducts,
      recentSales,
      lowStockProducts,
      categoryPerformance,
    ] = await Promise.all([
      // Total revenue
      prisma.sales.aggregate({
        where,
        _sum: { totalAmount: true },
      }),

      // Total number of sales
      prisma.sales.count({ where }),

      // Total unique customers
      prisma.sales.findMany({
        where,
        select: { customerId: true },
        distinct: ["customerId"],
      }),

      // Average order value
      prisma.sales.aggregate({
        where,
        _avg: { totalAmount: true },
      }),

      // Top selling products
      prisma.saleItem.groupBy({
        by: ["productId"],
        where: {
          sale: where,
        },
        _sum: { quantity: true, unitPrice: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),

      // Recent sales
      prisma.sales.findMany({
        where: shopId ? { shopId: shopId as string } : {},
        include: {
          customer: {
            select: { name: true, phone: true },
          },
          shop: {
            select: { name: true },
          },
        },
        orderBy: { saleDate: "desc" },
        take: 5,
      }),

      // Low stock products
      prisma.inventory.findMany({
        where: {
          quantity: { lte: 10 },
          ...(shopId && { shopId: shopId as string }),
        },
        include: {
          product: {
            select: { name: true, price: true },
          },
          shop: {
            select: { name: true },
          },
        },
        orderBy: { quantity: "asc" },
        take: 10,
      }),

      // Category performance
      prisma.saleItem.groupBy({
        by: ["productId"],
        where: {
          sale: where,
        },
        _sum: { quantity: true, unitPrice: true },
      }),
    ]);

    // Get product details for top selling products
    const topProductsWithDetails = await Promise.all(
      topSellingProducts.map(async (item) => {
        const product = await prisma.products.findUnique({
          where: { id: item.productId },
          select: {
            name: true,
            price: true,
            category: { select: { name: true } },
          },
        });
        return {
          product,
          quantitySold: item._sum.quantity || 0,
          revenue: (item._sum.quantity || 0) * parseFloat(product?.price || "0"),
        };
      })
    );

    // Calculate category performance
    const categoryStats = new Map();
    for (const item of categoryPerformance) {
      const product = await prisma.products.findUnique({
        where: { id: item.productId },
        include: { category: true },
      });

      if (product?.category) {
        const categoryName = product.category.name;
        const existing = categoryStats.get(categoryName) || { quantity: 0, revenue: 0 };
        categoryStats.set(categoryName, {
          quantity: existing.quantity + (item._sum.quantity || 0),
          revenue: existing.revenue + (item._sum.quantity || 0) * parseFloat(product.price),
        });
      }
    }

    const categoryPerformanceArray = Array.from(categoryStats.entries()).map(([name, stats]) => ({
      category: name,
      ...stats,
    }));

    res.status(200).json({
      success: true,
      message: "Business dashboard retrieved successfully",
      data: {
        summary: {
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          totalSales,
          totalCustomers: totalCustomers.length,
          averageOrderValue: averageOrderValue._avg.totalAmount || 0,
        },
        topSellingProducts: topProductsWithDetails,
        recentSales,
        lowStockProducts,
        categoryPerformance: categoryPerformanceArray,
        period,
      },
    });
  }
);

// Get inventory report
export const getInventoryReport = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { shopId, categoryId, lowStock = false } = req.query;

    const where: any = {};

    if (shopId) {
      where.shopId = shopId as string;
    }

    if (lowStock === "true") {
      where.quantity = { lte: 10 };
    }

    if (categoryId) {
      where.product = {
        categoryId: categoryId as string,
      };
    }

    const inventory = await prisma.inventory.findMany({
      where,
      include: {
        product: {
          include: {
            category: {
              select: { name: true },
            },
          },
        },
        shop: {
          select: { name: true, location: true },
        },
        warehouse: {
          select: { name: true },
        },
      },
      orderBy: { quantity: "asc" },
    });

    // Calculate inventory statistics
    const totalProducts = inventory.length;
    const totalValue = inventory.reduce((sum, item) =>
      sum + (item.quantity * parseFloat(item.product.price)), 0
    );
    const lowStockCount = inventory.filter(item => item.quantity <= 10).length;
    const outOfStockCount = inventory.filter(item => item.quantity === 0).length;

    res.status(200).json({
      success: true,
      message: "Inventory report retrieved successfully",
      data: {
        summary: {
          totalProducts,
          totalValue,
          lowStockCount,
          outOfStockCount,
        },
        inventory,
      },
    });
  }
);

// Get sales report
export const getSalesReport = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      shopId,
      startDate,
      endDate,
      groupBy = "day",
      paymentMode
    } = req.query;

    const where: any = {};

    if (shopId) {
      where.shopId = shopId as string;
    }

    if (paymentMode) {
      where.paymentMode = paymentMode;
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


    // Get sales data
    const sales = await prisma.sales.findMany({
      where,
      include: {
        customer: {
          select: { name: true, phone: true },
        },
        shop: {
          select: { name: true },
        },
        saleItems: {
          include: {
            product: {
              select: { name: true, category: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { saleDate: "desc" },
    });

    // Group sales by specified period
    const groupedSales = new Map();

    sales.forEach(sale => {
      let key: string;
      const date = new Date(sale.saleDate);

      switch (groupBy) {
        case "day":
          key = date.toISOString().split('T')[0];
          break;
        case "week":
          const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
          key = weekStart.toISOString().split('T')[0];
          break;
        case "month":
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      const existing = groupedSales.get(key) || { count: 0, revenue: 0, sales: [] };
      groupedSales.set(key, {
        count: existing.count + 1,
        revenue: existing.revenue + sale.totalAmount,
        sales: [...existing.sales, sale],
      });
    });

    const salesByPeriod = Array.from(groupedSales.entries()).map(([period, data]) => ({
      period,
      ...data,
    }));

    // Calculate summary statistics
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalSales = sales.length;
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Payment mode breakdown
    const paymentModeStats = sales.reduce((acc, sale) => {
      acc[sale.paymentMode] = (acc[sale.paymentMode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.status(200).json({
      success: true,
      message: "Sales report retrieved successfully",
      data: {
        summary: {
          totalRevenue,
          totalSales,
          averageOrderValue,
          paymentModeBreakdown: paymentModeStats,
        },
        salesByPeriod,
        detailedSales: sales,
      },
    });
  }
);

export const getProductPerformanceReport = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      shopId,
      categoryId,
      startDate,
      endDate,
      limit = 20,
      page = 1,
      sortBy = "quantitySold", // or "totalRevenue"
    } = req.query;

    const where: any = { sale: {} };

    if (shopId) {
      where.sale.shopId = shopId as string;
    }

    if (startDate || endDate) {
      where.sale.saleDate = {};
      if (startDate) where.sale.saleDate.gte = new Date(startDate as string);
      if (endDate) where.sale.saleDate.lte = new Date(endDate as string);
    }

    // Group by productId and calculate totals
    const productPerformance = await prisma.saleItem.groupBy({
      by: ["productId"],
      where,
      _sum: { quantity: true, unitPrice: true },
      _count: { productId: true },
    });

    const productsWithMetrics = await Promise.all(
      productPerformance.map(async (item) => {
        const product = await prisma.products.findUnique({
          where: { id: item.productId },
          include: { category: { select: { name: true } } },
        });

        if (!product) return null;

        // Handle category filtering (skip if categoryId is "all" or undefined)
        if (
          categoryId &&
          categoryId !== "all" &&
          product.categoryId !== categoryId
        ) {
          return null;
        }

        const quantitySold = item._sum.quantity || 0;
        const totalRevenue = quantitySold * parseFloat(product.price);
        const numberOfSales = item._count.productId;

        return {
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category?.name || "N/A",
          },
          metrics: {
            quantitySold,
            totalRevenue,
            numberOfSales,
            averageQuantityPerSale: quantitySold / numberOfSales,
          },
        };
      })
    );

    const filteredProducts = productsWithMetrics.filter((item): item is NonNullable<typeof item> => item !== null);

    // Sort by either quantitySold or totalRevenue
    filteredProducts.sort((a, b) => {
      if (sortBy === "totalRevenue") {
        return b.metrics.totalRevenue - a.metrics.totalRevenue;
      } else {
        return b.metrics.quantitySold - a.metrics.quantitySold;
      }
    });

    // Pagination logic
    const totalItems = filteredProducts.length;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const start = (pageNum - 1) * limitNum;
    const paginated = filteredProducts.slice(start, start + limitNum);

    // Response
    res.status(200).json({
      success: true,
      message: "Product performance report retrieved successfully",
      data: paginated,
      meta: {
        count: paginated.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalItems / limitNum),
        totalItems,
      },
    });
  }
);

// Get purchase report
export const getPurchaseReport = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      shopId,
      supplierId,
      startDate,
      endDate,
      status,
      groupBy = "day",
      limit = 50,
      page = 1
    } = req.query;

    const limitNum = Number(limit);
    const pageNum = Number(page);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (shopId) where.shopId = shopId as string;
    if (supplierId) where.supplierId = supplierId as string;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.purchaseDate = {};
      if (startDate) where.purchaseDate.gte = new Date(startDate as string);
      if (endDate) where.purchaseDate.lte = new Date(endDate as string);
    }

    // Total purchase count for pagination
    const totalPurchases = await prisma.purchase.count({ where });

    // Paginated purchases
    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        shop: { select: { name: true, location: true } },
        Suppliers: { select: { name: true, email: true, phone: true } },
        purchaseItems: {
          include: {
            product: {
              select: {
                name: true,
                price: true,
                category: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { purchaseDate: "desc" },
      skip,
      take: limitNum,
    });

    const groupedPurchases = new Map();

    purchases.forEach(purchase => {
      const date = new Date(purchase.purchaseDate);
      let key: string;

      switch (groupBy) {
        case "week":
          key = new Date(date.setDate(date.getDate() - date.getDay())).toISOString().split('T')[0];
          break;
        case "month":
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case "year":
          key = `${date.getFullYear()}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      const existing = groupedPurchases.get(key) || {
        count: 0,
        totalAmount: 0,
        totalItems: 0,
        purchases: []
      };

      const totalItems = purchase.purchaseItems.reduce((sum, item) => sum + item.quantity, 0);

      groupedPurchases.set(key, {
        count: existing.count + 1,
        totalAmount: existing.totalAmount + purchase.totalAmount,
        totalItems: existing.totalItems + totalItems,
        purchases: [...existing.purchases, purchase],
      });
    });

    const purchasesByPeriod = Array.from(groupedPurchases.entries()).map(([period, data]) => ({
      period,
      ...data,
    }));

    const totalPurchaseAmount = purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
    const averagePurchaseValue = purchases.length > 0 ? totalPurchaseAmount / purchases.length : 0;

    const statusBreakdown = purchases.reduce((acc, purchase) => {
      acc[purchase.status] = (acc[purchase.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const supplierStats = new Map();
    purchases.forEach(purchase => {
      const supplierName = purchase.Suppliers.name;
      const existing = supplierStats.get(supplierName) || {
        count: 0,
        totalAmount: 0,
        supplier: purchase.Suppliers
      };
      supplierStats.set(supplierName, {
        count: existing.count + 1,
        totalAmount: existing.totalAmount + purchase.totalAmount,
        supplier: existing.supplier,
      });
    });

    const supplierPerformance = Array.from(supplierStats.entries()).map(([name, stats]) => ({
      supplierName: name,
      ...stats,
      averageOrderValue: stats.totalAmount / stats.count,
    }));

    const productStats = new Map();
    purchases.forEach(purchase => {
      purchase.purchaseItems.forEach(item => {
        const productName = item.product.name;
        const existing = productStats.get(productName) || {
          totalQuantity: 0,
          totalAmount: 0,
          purchaseCount: 0,
          product: item.product
        };
        productStats.set(productName, {
          totalQuantity: existing.totalQuantity + item.quantity,
          totalAmount: existing.totalAmount + (item.quantity * item.unitPrice),
          purchaseCount: existing.purchaseCount + 1,
          product: existing.product,
        });
      });
    });

    const productPurchaseAnalysis = Array.from(productStats.entries())
      .map(([name, stats]) => ({
        productName: name,
        ...stats,
        averageUnitPrice: stats.totalAmount / stats.totalQuantity,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    const returnAnalysis = await prisma.stockLog.findMany({
      where: {
        changeType: 'RETURN_TO_SUPPLIER',
        ...(shopId && { shopId: shopId as string }),
        ...(startDate || endDate ? {
          createdAt: {
            ...(startDate && { gte: new Date(startDate as string) }),
            ...(endDate && { lte: new Date(endDate as string) }),
          }
        } : {}),
      },
      include: {
        product: {
          select: { name: true, price: true },
        },
      },
    });

    const totalReturns = returnAnalysis.length;
    const totalReturnedQuantity = returnAnalysis.reduce((sum, log) => sum + Math.abs(log.quantity), 0);
    const returnReasons = returnAnalysis.reduce((acc, log) => {
      const reason = log.reason || 'No reason specified';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.status(200).json({
      success: true,
      message: "Purchase report retrieved successfully",
      data: {
        summary: {
          totalPurchaseAmount,
          totalPurchases: purchases.length,
          averagePurchaseValue,
          statusBreakdown,
          totalReturns,
          totalReturnedQuantity,
          returnRate: purchases.length > 0 ? (totalReturns / purchases.length) * 100 : 0,
        },
        purchasesByPeriod,
        supplierPerformance: supplierPerformance.sort((a, b) => b.totalAmount - a.totalAmount),
        productPurchaseAnalysis,
        returnAnalysis: {
          totalReturns,
          totalReturnedQuantity,
          returnReasons,
          recentReturns: returnAnalysis.slice(0, 10),
        },
        detailedPurchases: purchases,
        filters: { shopId, supplierId, startDate, endDate, status, groupBy, limit },
        meta: {
          page: pageNum,
          limit: limitNum,
          totalItems: totalPurchases,
          totalPages: Math.ceil(totalPurchases / limitNum),
          count: purchases.length
        }
      },
    });
  }
);

// Get purchase analytics dashboard
export const getPurchaseAnalytics = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { shopId, period = "month" } = req.query;

    let dateFilter: any = {};
    const now = new Date();

    switch (period) {
      case "day":
        dateFilter = {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        };
        break;
      case "week":
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        dateFilter = { gte: weekStart };
        break;
      case "month":
        dateFilter = {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
        };
        break;
      case "year":
        dateFilter = {
          gte: new Date(now.getFullYear(), 0, 1),
        };
        break;
    }

    const where: any = { purchaseDate: dateFilter };
    if (shopId) {
      where.shopId = shopId as string;
    }

    const [
      totalPurchaseAmount,
      totalPurchases,
      averagePurchaseValue,
      topSuppliers,
      recentPurchases,
      pendingPurchases,
      purchasesByStatus,
    ] = await Promise.all([
      // Total purchase amount
      prisma.purchase.aggregate({
        where,
        _sum: { totalAmount: true },
      }),

      // Total number of purchases
      prisma.purchase.count({ where }),

      // Average purchase value
      prisma.purchase.aggregate({
        where,
        _avg: { totalAmount: true },
      }),

      // Top suppliers by purchase amount
      prisma.purchase.groupBy({
        by: ["supplierId"],
        where,
        _sum: { totalAmount: true },
        _count: { supplierId: true },
        orderBy: { _sum: { totalAmount: "desc" } },
        take: 5,
      }),

      // Recent purchases
      prisma.purchase.findMany({
        where: shopId ? { shopId: shopId as string } : {},
        include: {
          Suppliers: {
            select: { name: true },
          },
          shop: {
            select: { name: true },
          },
        },
        orderBy: { purchaseDate: "desc" },
        take: 5,
      }),

      // Pending purchases
      prisma.purchase.findMany({
        where: {
          status: 'PENDING',
          ...(shopId && { shopId: shopId as string }),
        },
        include: {
          Suppliers: {
            select: { name: true },
          },
        },
        orderBy: { purchaseDate: "desc" },
      }),

      // Purchases by status
      prisma.purchase.groupBy({
        by: ["status"],
        where,
        _count: { status: true },
        _sum: { totalAmount: true },
      }),
    ]);

    // Get supplier details for top suppliers
    const topSuppliersWithDetails = await Promise.all(
      topSuppliers.map(async (item) => {
        const supplier = await prisma.suppliers.findUnique({
          where: { id: item.supplierId },
          select: { name: true, email: true, phone: true },
        });
        return {
          supplier,
          totalPurchaseAmount: item._sum.totalAmount || 0,
          purchaseCount: item._count.supplierId,
          averagePurchaseValue: (item._sum.totalAmount || 0) / item._count.supplierId,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Purchase analytics retrieved successfully",
      data: {
        summary: {
          totalPurchaseAmount: totalPurchaseAmount._sum.totalAmount || 0,
          totalPurchases,
          averagePurchaseValue: averagePurchaseValue._avg.totalAmount || 0,
          pendingPurchasesCount: pendingPurchases.length,
        },
        topSuppliers: topSuppliersWithDetails,
        recentPurchases,
        pendingPurchases,
        purchasesByStatus,
        period,
      },
    });
  }
);

// Get supplier performance report
export const getSupplierPerformanceReport = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { shopId, startDate, endDate, limit = 20 } = req.query;

    const where: any = {};

    if (startDate || endDate) {
      where.purchaseDate = {};
      if (startDate) {
        where.purchaseDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.purchaseDate.lte = new Date(endDate as string);
      }
    }

    if (shopId) {
      where.shopId = shopId as string;
    }

    // Get supplier performance data
    const supplierPerformance = await prisma.purchase.groupBy({
      by: ["supplierId"],
      where,
      _sum: { totalAmount: true },
      _count: { supplierId: true },
      _avg: { totalAmount: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: Number(limit),
    });

    // Get detailed supplier information and metrics
    const suppliersWithMetrics = await Promise.all(
      supplierPerformance.map(async (item) => {
        const supplier = await prisma.suppliers.findUnique({
          where: { id: item.supplierId },
          select: {
            name: true,
            email: true,
            phone: true,
            address: true,
            isActive: true
          },
        });

        if (!supplier) return null;

        // Get return data for this supplier
        const returns = await prisma.stockLog.count({
          where: {
            changeType: 'RETURN_TO_SUPPLIER',
            product: {
              suppliersId: item.supplierId,
            },
            ...(shopId && { shopId: shopId as string }),
            ...(startDate || endDate ? {
              createdAt: {
                ...(startDate && { gte: new Date(startDate as string) }),
                ...(endDate && { lte: new Date(endDate as string) }),
              }
            } : {}),
          },
        });

        // Get recent purchases from this supplier
        const recentPurchases = await prisma.purchase.findMany({
          where: {
            supplierId: item.supplierId,
            ...(shopId && { shopId: shopId as string }),
          },
          orderBy: { purchaseDate: "desc" },
          take: 3,
          select: {
            id: true,
            purchaseDate: true,
            totalAmount: true,
            status: true,
          },
        });

        return {
          supplier,
          metrics: {
            totalPurchaseAmount: item._sum.totalAmount || 0,
            purchaseCount: item._count.supplierId,
            averagePurchaseValue: item._avg.totalAmount || 0,
            returnCount: returns,
            returnRate: item._count.supplierId > 0 ? (returns / item._count.supplierId) * 100 : 0,
          },
          recentPurchases,
        };
      })
    );

    const filteredSuppliers = suppliersWithMetrics.filter(item => item !== null);

    res.status(200).json({
      success: true,
      message: "Supplier performance report retrieved successfully",
      data: filteredSuppliers,
    });
  }
);

export const getCustomerAnalytics = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { shopId, period = "month" } = req.query;

    const now = new Date();
    let dateFilter: any = {};

    switch (period) {
      case "month":
        dateFilter.gte = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        dateFilter.gte = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const where: any = {
      ...(Object.keys(dateFilter).length ? { saleDate: dateFilter } : {}),
      ...(shopId ? { shopId: shopId as string } : {}),
    };

    const [
      // Total unique customers who made purchases in the given period
      totalCustomers,
      // Customers who made their first purchase in the given period
      newCustomers,
      // Customers with more than one purchase (repeat)
      repeatCustomers,
      // Top customers based on total spending
      customerLifetimeValue,
    ] = await Promise.all([
      prisma.sales.findMany({
        where,
        select: { customerId: true },
        distinct: ["customerId"],
      }),

      prisma.sales.findMany({
        where: {
          ...where,
          saleDate: dateFilter,
        },
        select: { customerId: true },
        distinct: ["customerId"],
      }),

      prisma.sales.groupBy({
        by: ["customerId"],
        where,
        _count: { customerId: true },
        having: {
          customerId: {
            _count: { gt: 1 },
          },
        },
      }),

      prisma.sales.groupBy({
        by: ["customerId"],
        where,
        _sum: { totalAmount: true },
        _count: { customerId: true },
        orderBy: {
          _sum: {
            totalAmount: "desc",
          },
        },
        take: 10,
      }),
    ]);

    // Get details of top customers
    const topCustomers = await Promise.all(
      customerLifetimeValue.map(async (item) => {
        const customer = await prisma.customer.findUnique({
          where: { id: item.customerId },
          select: {
            name: true,
            phone: true,
            email: true,
          },
        });

        return {
          customer,
          totalSpent: item._sum.totalAmount || 0,
          totalPurchases: item._count.customerId,
          averageOrderValue:
            (item._sum.totalAmount || 0) / item._count.customerId,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Customer analytics retrieved successfully",
      data: {
        summary: {
          totalCustomers: totalCustomers.length,
          newCustomers: newCustomers.length,
          repeatCustomers: repeatCustomers.length,
          customerRetentionRate:
            totalCustomers.length > 0
              ? (repeatCustomers.length / totalCustomers.length) * 100
              : 0,
        },
        topCustomers,
        period,
      },
    });
  }
);
