import { Request, Response, NextFunction } from "express";
import CustomError from "../helpers/CustomError";
import prisma from "../db/prisma-client";
import UtilityFunctions from "../utils/UtilityFunctions";
import asyncHandler from "../helpers/asyncHandler";


export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Registration logic
    if (!req.body) throw new CustomError("Request body is required", 400);

    const { email, password, firstName, lastName, role } = req.body;
    if (!email || !password || !firstName) throw new CustomError("Email, password, and first name are required", 400);

    const existingUser = await prisma.user.findUnique({
        where: {
            email
        }
    });
    if (existingUser) throw new CustomError("User already exists", 409);

    const hashedPassword = UtilityFunctions.hashPassword(password);
    const newUser = await prisma.user.create({
        data: {
            email,
            hashedPassword,
            firstName,
            lastName,
            role
        }
    });
    if (!newUser) throw new CustomError("User registration failed", 500);

    res.status(200).json({
        success: true,
        message: "User registered successfully",
        data: newUser
    });
});

export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // check if request body is present
    if (!req.body) throw new CustomError("Request body is required", 400);

    // Destructure email and password from request body
    const { email, password } = req.body;
    if (!email || !password) throw new CustomError("Email and password are required", 400);
    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new CustomError("User not found", 404);

    // Compare password
    const isPasswordValid = UtilityFunctions.comparePassword(password, user.hashedPassword);
    if (!isPasswordValid) throw new CustomError("Invalid password", 401);

    // Generate tokens
    const payload = { id: user.id, email: user.email };
    const tokens = await UtilityFunctions.generateTokens(payload);

    // Set cookies (if needed)

    res.status(200).json({
        success: true,
        message: "User logged in successfully",
        data: tokens
    });
});

export const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Logout logic
});

export const refreshAccessToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Refresh token logic
});



