import { Request, Response } from 'express';
import asyncHandler from '../helpers/asyncHandler';
import prisma from '../db/prisma-client';
import CustomError from '../helpers/CustomError'; import { UserPayload } from '../interfaces/jwtInterface';

export const createShop = asyncHandler(async (req: Request, res: Response) => {
    const { name, location } = req.body;

    if (!name || !location) throw new CustomError('Name and location are required', 400);

    const ownerId: any = (req.user as UserPayload)?.id || "system"; // Assuming user ID is stored in req.user
    const newShop = await prisma.shop.create({
        data: {
            name,
            location,
            ownerId
        },
    });

    res.status(201).json({ success: true, message: 'Shop created successfully', data: newShop });
});

export const getAllShops = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, sort } = req.query;

    const sortOrder = (sort === 'asc' || sort === 'desc') ? sort : 'desc';

    const shops = await prisma.shop.findMany({
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { "createdAt": sortOrder }
    });
    const responseData = {
        shops: shops,
        meta: {
            total: await prisma.shop.count(),
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(await prisma.shop.count() / Number(limit))
        }
    };

    if (!shops) throw new CustomError('No shops found', 404);
    res.json({ success: true, message: 'Shops fetched successfully', data: responseData });
});

export const getShopById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) throw new CustomError('Shop ID is required', 400);

    const shop = await prisma.shop.findUnique({
        where: { id },
    });

    if (!shop) throw new CustomError('Shop not found', 404);

    res.json({ success: true, message: 'Shop fetched successfully', data: shop });
});

export const updateShop = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, location } = req.body;

    if (!id) throw new CustomError('Shop ID is required', 400);

    if (!name && !location) throw new CustomError('At least one field (name or location) is required to update', 400);

    const shopData: any = {};

    if (name) shopData.name = name;
    if (location) shopData.location = location;
    // if (ownerId) shopData.ownerId = ownerId;

    const updatedShop = await prisma.shop.update({
        where: { id },
        data: shopData,
    });

    res.json({ success: true, message: 'Shop updated successfully', data: updatedShop });
});

export const deleteShop = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) throw new CustomError('Shop ID is required', 400);

    await prisma.shop.delete({
        where: { id },
    });

    res.json({ success: true, message: 'Shop deleted successfully' });
});
