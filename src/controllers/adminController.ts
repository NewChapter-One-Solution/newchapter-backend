import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/asyncHandler";
import CustomError from "../utils/CustomError";
import prisma from "../models/prisma-client";
import { Role } from "@prisma/client";
import { testEmailConfiguration, sendSampleInvoice } from "../utils/testEmail";
import { lowStockEmailService } from "../services/lowStockEmailService";
import logger from "../utils/logger";

export const getDashboardStats = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Fetch stats from database
    const [
      totalUsers,
      totalProducts,
      totalShops,
      totalPurchases,
      totalSales,
      activeUsers,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.products.count(),
      prisma.shop.count(),
      prisma.purchase.count(),
      prisma.sales.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

    const stats = {
      totalUsers,
      totalProducts,
      totalShops,
      totalPurchases,
      totalSales,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      recentUsers,
    };

    res.status(200).json({
      success: true,
      message: "Dashboard stats retrieved successfully",
      data: stats,
    });
  }
);

export const getAllUsers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { page = 1, limit = 20, role, isActive, search } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const where: any = {};

    if (role) {
      where.role = role as Role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: "insensitive" } },
        { firstName: { contains: search as string, mode: "insensitive" } },
        { lastName: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          department: true,
          shopId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / take);

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: {
        users,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalItems: total,
          itemsPerPage: take,
          hasNextPage: Number(page) < totalPages,
          hasPrevPage: Number(page) > 1,
        },
      },
    });
  }
);

export const updateUserStatus = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (!userId) {
      throw new CustomError("User ID is required", 400);
    }

    if (typeof isActive !== "boolean") {
      throw new CustomError("isActive must be a boolean value", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    // User status updated successfully

    res.status(200).json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      data: updatedUser,
    });
  }
);

export const updateUserRole = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!userId) {
      throw new CustomError("User ID is required", 400);
    }

    if (!role || !Object.values(Role).includes(role)) {
      throw new CustomError("Valid role is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    // User role updated successfully

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: updatedUser,
    });
  }
);

// Test email configuration
export const testEmailConfig = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { testEmail } = req.body;

    if (!testEmail) {
      throw new CustomError("Test email address is required", 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      throw new CustomError("Invalid email address format", 400);
    }

    try {
      const emailSent = await testEmailConfiguration(testEmail);

      if (emailSent) {
        res.status(200).json({
          success: true,
          message: `Test email sent successfully to ${testEmail}`,
          data: {
            testEmail,
            emailSent: true,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        throw new CustomError("Failed to send test email", 500);
      }
    } catch (error) {
      logger.error(`Error sending test email to ${testEmail}:`, error);
      throw new CustomError("Failed to send test email. Please check your email configuration.", 500);
    }
  }
);

// Send sample invoice email
export const sendSampleInvoiceEmail = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { testEmail } = req.body;

    if (!testEmail) {
      throw new CustomError("Test email address is required", 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      throw new CustomError("Invalid email address format", 400);
    }

    try {
      const emailSent = await sendSampleInvoice(testEmail);

      if (emailSent) {
        res.status(200).json({
          success: true,
          message: `Sample invoice email sent successfully to ${testEmail}`,
          data: {
            testEmail,
            emailSent: true,
            sampleType: 'invoice',
            timestamp: new Date().toISOString()
          }
        });
      } else {
        throw new CustomError("Failed to send sample invoice email", 500);
      }
    } catch (error) {
      logger.error(`Error sending sample invoice email to ${testEmail}:`, error);
      throw new CustomError("Failed to send sample invoice email. Please check your email configuration.", 500);
    }
  }
);

// Send test low stock alert email
export const sendTestLowStockAlert = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { testEmail, shopId } = req.body;

    if (!testEmail) {
      throw new CustomError("Test email address is required", 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      throw new CustomError("Invalid email address format", 400);
    }

    try {
      const emailSent = await lowStockEmailService.sendTestLowStockAlert(testEmail, shopId);

      if (emailSent) {
        res.status(200).json({
          success: true,
          message: `Test low stock alert sent successfully to ${testEmail}`,
          data: {
            testEmail,
            shopId: shopId || 'sample-shop-id',
            emailSent: true,
            sampleType: 'low-stock-alert',
            timestamp: new Date().toISOString()
          }
        });
      } else {
        throw new CustomError("Failed to send test low stock alert", 500);
      }
    } catch (error) {
      logger.error(`Error sending test low stock alert to ${testEmail}:`, error);
      throw new CustomError("Failed to send test low stock alert. Please check your email configuration.", 500);
    }
  }
);


