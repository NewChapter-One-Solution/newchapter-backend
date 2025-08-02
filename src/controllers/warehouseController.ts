import { Request, Response } from "express";
import prisma from "../models/prisma-client";
import asyncHandler from "../utils/asyncHandler";
import CustomError from "../utils/CustomError";
import { UserPayload } from "../types/jwtInterface";
import { paginate } from "../utils/paginatedResponse";

export const getAllWarehouses = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, sort = "desc" } = req.query;

    const sortOrder = (sort === 'asc' || sort === 'desc') ? sort : 'desc';

    const warehouses = await paginate({
        model: "warehouses",
        page: Number(page),
        limit: Number(limit),
        select: {
            id: true,
            name: true,
            location: true,
            capacity: true,
        },
        orderBy: { "createdAt": sortOrder },
    });

    const responseData = {
        warehouses: warehouses.data,
        meta: warehouses.meta
    };

    if (!warehouses || warehouses.data.length === 0) throw new CustomError("No warehouses found", 404);

    res.status(200).json({ success: true, status: 200, message: "Warehouses fetched successfully", data: responseData });
});

export const getWarehouseById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const warehouse = await prisma.warehouses.findUnique({
        where: { id },
    });
    if (!warehouse) throw new CustomError("Warehouse not found", 404);
    res.status(200).json({ success: true, status: 200, message: "Warehouse fetched successfully", data: warehouse });
});

export const createWarehouse = asyncHandler(async (req: Request, res: Response) => {
    const { name, location } = req.body;
    if (!name || !location) throw new CustomError("All fields are required", 400);

    const createdBy = (req.user as UserPayload)?.id || "system"; // Assuming req.user is set by authentication middleware

    const newWarehouse = await prisma.warehouses.create({
        data: { name, location, createdBy },
    });
    if (!newWarehouse) throw new CustomError("Failed to create warehouse", 500);

    res.status(201).json({ success: true, status: 201, message: "Warehouse created successfully", data: newWarehouse });
});


export const updateWarehouse = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || typeof id !== 'string') throw new CustomError("Invalid or missing warehouse ID", 400);

    const { name, location, capacity } = req.body;

    const updateData: any = {};

    if (name) updateData.name = name;
    if (location) updateData.location = location;
    if (capacity) updateData.capacity = capacity;

    if (Object.keys(updateData).length === 0) throw new CustomError("At least one field is required to update", 400);

    const existingWarehouse = await prisma.warehouses.findUnique({ where: { id } });
    if (!existingWarehouse) throw new CustomError("Warehouse not found", 404);

    const updatedWarehouse = await prisma.warehouses.update({
        where: { id },
        data: updateData,
    });

    res.status(200).json({ success: true, status: 200, message: "Warehouse updated successfully", data: updatedWarehouse });
});


export const deleteWarehouse = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const deletedWarehouse = await prisma.warehouses.delete({
        where: { id },
    });
    if (!deletedWarehouse) throw new CustomError("Warehouse not found", 404);
    res.status(200).json({ success: true, status: 200, message: "Warehouse deleted successfully", data: deletedWarehouse });
});



