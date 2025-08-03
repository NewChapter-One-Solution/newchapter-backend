import { Request, Response } from "express";
import { Suppliers } from "@prisma/client";
import prisma from "../models/prisma-client";
import asyncHandler from "../utils/asyncHandler";
import CustomError from "../utils/CustomError";
import { UserPayload } from "../types/jwtInterface";
import { ISupplier } from "../interfaces/supplierInterface";
import { paginate } from "../utils/paginatedResponse";


export const createSupplier = asyncHandler(async (req: Request, res: Response) => {
    if (!req.body) throw new CustomError("Valid payload is required", 400);

    const createdBy = (req.user as UserPayload)?.id || "system"; // Assuming req.user is set by authentication middleware

    const { name, email, phone, address, website, gstid } = req.body;
    if (!name || !phone || !gstid) throw new CustomError("Name, phone, and GST ID are required fields", 400);

    const existingSupplier: Suppliers | null = await prisma.suppliers.findUnique({ where: { gstid } });
    if (existingSupplier) throw new CustomError("Supplier already exists", 409);

    const supplier: ISupplier = {
        name,
        phone,
        gstid,
        createdBy
    };
    if (email) supplier.email = email;
    if (address) supplier.address = address;
    if (website) supplier.website = website;

    const createdSupplier: Suppliers = await prisma.suppliers.create({
        data: supplier
    });

    res.status(201).json({ success: true, status: 201, message: "Supplier created successfully", data: createdSupplier });

});


export const getAllSuppliers = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, sort } = req.query;

    const sortOrder = (sort === 'asc' || sort === 'desc') ? sort : 'desc';

    // const suppliers: Suppliers[] = await prisma.suppliers.findMany();
    const suppliers = await paginate({
        model: "suppliers",
        page: Number(page),
        limit: Number(limit),
        orderBy: { "createdAt": sortOrder },
        select: { id: true, name: true, email: true, phone: true, address: true, website: true, gstid: true }
    });
    const responseData = {
        suppliers: suppliers.data,
        meta: suppliers.meta
    };
    res.status(200).json({ success: true, status: 200, message: "Suppliers fetched successfully", data: responseData });
});


export const getSupplierById = asyncHandler(async (req: Request, res: Response) => {
    if (!req.params) throw new CustomError("valid payload is required", 400);

    const { id } = req.params;
    if (!id) throw new CustomError("Supplier ID is required", 400);

    const supplier: Suppliers | null = await prisma.suppliers.findUnique({ where: { id } });
    if (!supplier) throw new CustomError("Supplier not found", 404);

    res.status(200).json({ success: true, status: 200, message: "Supplier fetched successfully", data: supplier });
});

export const updateSupplier = asyncHandler(async (req: Request, res: Response) => {
    if (!req.params || !req.body) throw new CustomError("Valid payload is required", 400);
    const { id } = req.params;
    // Logic to update supplier by ID
    const { name, email, phone, address, website, gstid } = req.body;
    const updatedData: Partial<ISupplier> = {};
    if (name) updatedData.name = name;
    if (email) updatedData.email = email;
    if (phone) updatedData.phone = phone;
    if (address) updatedData.address = address;
    if (website) updatedData.website = website;
    if (gstid) updatedData.gstid = gstid;

    if (Object.keys(updatedData).length === 0) throw new CustomError("No fields to update", 400);

    const updatedSupplier: Suppliers = await prisma.suppliers.update({
        where: { id },
        data: updatedData
    });
    if (!updatedSupplier) throw new CustomError("Error while updating supplier", 404);

    res.status(200).json({ success: true, status: 200, message: "Supplier updated successfully", data: updatedSupplier });

});

export const deleteSupplier = asyncHandler(async (req: Request, res: Response) => {
    if (!req.params) throw new CustomError("Valid payload is required", 400);
    const { id } = req.params;
    if (!id) throw new CustomError("Supplier ID is required", 400);
    // Logic to delete supplier by ID
    const deletedSupplier: Suppliers = await prisma.suppliers.delete({
        where: { id }
    });
    if (!deletedSupplier) throw new CustomError("Error while deleting supplier", 404);
    res.status(200).json({ success: true, status: 200, message: "Supplier deleted successfully", data: deletedSupplier });
});

