import { Request, Response } from "express";
import prisma from "../db/prisma-client";
import asyncHandler from "../helpers/asyncHandler";
import CustomError from "../helpers/CustomError";
import UtilityFunctions from "../utils/UtilityFunctions";
import { paginate } from "../utils/paginatedResponse";

export const getUser = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new CustomError('User not found', 404);
    res.status(200).json({ success: true, status: 200, message: 'User fetched successfully', data: req.user });
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;

    const users = await paginate({
        model: "user", page: Number(page), limit: Number(limit), select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
        }
    });

    if (!users || users.data.length === 0) throw new CustomError("No users found", 404);

    const responseData = {
        users: users.data,
        meta: users.meta
    };

    res.status(200).json({ success: true, status: 200, message: 'Users fetched successfully', data: responseData });
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = req.body;

    if (!userId || !role) throw new CustomError("User ID and role are required", 400);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new CustomError("User not found", 404);

    if (user.role === "ADMIN" && role !== "ADMIN") {
        throw new CustomError("Cannot change role of an admin user to a non-admin role", 403);
    }

    await prisma.user.update({
        where: { id: userId },
        data: { role }
    });

    res.status(200).json({
        success: true,
        message: "User role updated successfully"
    });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword) throw new CustomError("All fields are required", 400);

    if (confirmPassword) {
        if (newPassword !== confirmPassword) throw new CustomError("Passwords and confirm password do not match", 400);
    }

    // Cast req.user to the correct type that includes 'id'
    const userId: string | undefined = (req.user as { id?: string; })?.id; // Assuming user ID is stored in req.user after authentication
    if (!userId) throw new CustomError("User not authenticated", 401);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new CustomError("User not found", 404);

    const isOldPasswordValid = UtilityFunctions.comparePassword(oldPassword, user.hashedPassword);
    if (!isOldPasswordValid) throw new CustomError("Old password is incorrect", 400);

    const hashedNewPassword = UtilityFunctions.hashPassword(newPassword);

    await prisma.user.update({
        where: { id: userId },
        data: { hashedPassword: hashedNewPassword }
    });

    res.status(200).json({
        success: true,
        message: "Password changed successfully"
    });
});