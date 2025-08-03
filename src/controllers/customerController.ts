import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/asyncHandler";
import CustomError from "../utils/CustomError";
import prisma from "../models/prisma-client";
import { UserPayload } from "../types/jwtInterface";
import { paginate } from "../utils/paginatedResponse";

// Create a new customer
export const createCustomer = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, phone, email, address } = req.body;

    if (!name || !phone) {
      throw new CustomError("Name and phone are required", 400);
    }

    // Check if customer with same phone already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: { phone },
    });

    if (existingCustomer) {
      throw new CustomError("Customer with this phone number already exists", 409);
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        email,
        address,
      },
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  }
);

// Get all customers with pagination and search
export const getAllCustomers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { page = 1, limit = 10, search } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { phone: { contains: search as string } },
        { email: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const customers = await paginate({
      model: "customer",
      page: Number(page),
      limit: Number(limit),
      where,
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      message: "Customers retrieved successfully",
      data: customers,
    });
  }
);

// Get customer by ID
export const getCustomerById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      throw new CustomError("Customer ID is required", 400);
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        Sales: {
          select: {
            id: true,
            invoiceNo: true,
            totalAmount: true,
            saleDate: true,
            paymentMode: true,
          },
          orderBy: { saleDate: "desc" },
          take: 10, // Last 10 purchases
        },
      },
    });

    if (!customer) {
      throw new CustomError("Customer not found", 404);
    }

    // Calculate customer statistics
    const customerStats = await prisma.sales.aggregate({
      where: { customerId: id },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    const customerData = {
      ...customer,
      statistics: {
        totalPurchases: customerStats._count.id,
        totalSpent: customerStats._sum.totalAmount || 0,
      },
    };

    res.status(200).json({
      success: true,
      message: "Customer retrieved successfully",
      data: customerData,
    });
  }
);

// Update customer
export const updateCustomer = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;

    if (!id) {
      throw new CustomError("Customer ID is required", 400);
    }

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      throw new CustomError("Customer not found", 404);
    }

    // Check if phone is being changed and if it conflicts with another customer
    if (phone && phone !== existingCustomer.phone) {
      const phoneConflict = await prisma.customer.findFirst({
        where: {
          phone,
          id: { not: id },
        },
      });

      if (phoneConflict) {
        throw new CustomError("Another customer with this phone number already exists", 409);
      }
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(email && { email }),
        ...(address && { address }),
      },
    });

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: updatedCustomer,
    });
  }
);

// Delete customer
export const deleteCustomer = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      throw new CustomError("Customer ID is required", 400);
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new CustomError("Customer not found", 404);
    }

    // Check if customer has any sales
    const salesCount = await prisma.sales.count({
      where: { customerId: id },
    });

    if (salesCount > 0) {
      throw new CustomError("Cannot delete customer with existing sales records", 400);
    }

    await prisma.customer.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  }
);

// Get customer purchase history
export const getCustomerPurchaseHistory = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!id) {
      throw new CustomError("Customer ID is required", 400);
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new CustomError("Customer not found", 404);
    }

    const purchases = await paginate({
      model: "sales",
      page: Number(page),
      limit: Number(limit),
      where: { customerId: id },
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
        shop: {
          select: {
            name: true,
            location: true,
          },
        },
      },
      orderBy: { saleDate: "desc" },
    });

    res.status(200).json({
      success: true,
      message: "Customer purchase history retrieved successfully",
      data: purchases,
    });
  }
);

// Get top customers
export const getTopCustomers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { limit = 10, period = "all" } = req.query;

    let dateFilter: any = {};

    if (period !== "all") {
      const now = new Date();
      switch (period) {
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
    }

    const topCustomers = await prisma.customer.findMany({
      include: {
        Sales: {
          where: period !== "all" ? { saleDate: dateFilter } : {},
          select: {
            totalAmount: true,
          },
        },
      },
    });

    // Calculate total spent for each customer and sort
    const customersWithTotals = topCustomers
      .map((customer) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        totalSpent: customer.Sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
        totalPurchases: customer.Sales.length,
      }))
      .filter((customer) => customer.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, Number(limit));

    res.status(200).json({
      success: true,
      message: "Top customers retrieved successfully",
      data: customersWithTotals,
    });
  }
);