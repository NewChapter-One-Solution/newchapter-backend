import { Request, Response, NextFunction } from "express";
import CustomError from "../utils/CustomError";
import prisma from "../models/prisma-client";

import asyncHandler from "../utils/asyncHandler";
import { UserPayload } from "../types/jwtInterface";
import { clearAuthCookies, comparePassword, generateTokensAndStoreHashedRefreshToken, hashPassword, hashToken, setCookie, verifyRefreshToken } from "../utils/helperFunctions";

export const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Registration logic
    if (!req.body) throw new CustomError("Request body is required", 400);

    const { email, password, firstName, lastName, role } = req.body;
    if (!email || !password || !firstName) throw new CustomError("Email, password, and first name are required", 400);

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) throw new CustomError("User already exists", 409);

    const hashedPassword = hashPassword(password);
    const newUser = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        firstName,
        lastName,
        role,
      },
    });
    if (!newUser) throw new CustomError("User registration failed", 500);

    res.status(200).json({
      success: true,
      message: "User registered successfully",
      data: newUser,
    });
  }
);

export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // check if request body is present
    if (!req.body) throw new CustomError("Request body is required", 400);

    // Destructure email and password from request body
    const { email, password } = req.body;
    if (!email || !password) throw new CustomError("Email and password are required", 400);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        hashedPassword: true,
        shopId: true,
        department: true,
      },
    });
    if (!user) throw new CustomError("User not found! Please sign up", 404);

    // Check if user is active
    if (!user.isActive)
      throw new CustomError(
        "Account is deactivated. Please contact administrator",
        403
      );

    // Compare password
    const isPasswordValid = comparePassword(password, user.hashedPassword);
    if (!isPasswordValid) throw new CustomError("Invalid password", 401);

    // Generate tokens
    const payload = { id: user.id, email: user.email };
    const tokens = await generateTokensAndStoreHashedRefreshToken(payload);

    //set cookie
    setCookie(res, tokens);

    // User data for response
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      shopId: user.shopId,
      department: user.department,
    };

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: {
        ...tokens,
        user: userData,
      },
    });
  }
);

export const logout = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {

    const user = req.user as UserPayload;
    if (!user) throw new CustomError("User not authenticated", 401);

    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      const hashedToken = hashToken(refreshToken);
      await prisma.refreshToken.deleteMany({
        where: {
          userId: user.id,
          token: hashedToken,
        },
      });
    }

    // clear cookie
    clearAuthCookies(res);


    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  }
);

export const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body;

    if (!refreshToken) throw new CustomError("Refresh token is required", 400);

    // Check if refresh token is valid
    const decoded = await verifyRefreshToken(refreshToken);

    console.log(decoded);

    // generate new access token
    const { accessToken, accessTokenExp } = await generateTokensAndStoreHashedRefreshToken(decoded);


    res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      data: {
        accessToken,
        accessTokenExp,
      },
    });
  }
);

export const getUserPermissions = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as UserPayload;

    if (!user) {
      throw new CustomError("User not authenticated", 401);
    }

    // Import RBACService here to avoid circular dependency
    const { RBACService } = await import("../middleware/rbacMiddleware");
    const permissions = RBACService.getUserPermissions(user.role as any);

    res.status(200).json({
      success: true,
      message: "User permissions retrieved successfully",
      data: {
        userId: user.id,
        role: user.role,
        permissions,
      },
    });
  }
);

export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as UserPayload;

    if (!user) {
      throw new CustomError("User not authenticated", 401);
    }

    // Fetch user data from database
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        shopId: true,
        department: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!userData) {
      throw new CustomError("User not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Current user data retrieved successfully",
      data: userData,
    });
  }
);
