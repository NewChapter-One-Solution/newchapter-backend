import { Request, Response } from "express";
import CustomError from "../helpers/CustomError";
import prisma from "../db/prisma-client";
import asyncHandler from "../helpers/asyncHandler";
import { Category } from "../../generated/prisma";
import { ICategory } from "../interfaces/categoriesInterfaces";
import { UserPayload } from "../interfaces/jwtInterface";
import { paginate } from "../utils/paginatedResponse";

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
    const { name, parentId } = req.body;

    if (!name) throw new CustomError("Category name is required", 400);

    const createdBy = (req.user as UserPayload)?.id || "system";

    const category: Category = await prisma.category.create({
        data: {
            name,
            parentId: parentId || null, // null for top-level
            createdBy
        },
    });

    res.status(201).json({ success: true, data: category });
});

// GET /api/categories
export const getAllCategories = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, sort } = req.query;
    const sortOrder = (sort === 'asc' || sort === 'desc') ? sort : 'desc';

    const [categories, total]: [Category[], number] = await prisma.$transaction([
        prisma.category.findMany({
            where: { parentId: null },
            include: {
                children: {
                    include: {
                        children: {
                            include: {
                                children: true // you can nest more if needed
                            }
                        }
                    }
                }
            },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { createdAt: sortOrder }
        }),
        prisma.category.count({ where: { parentId: null } })
    ]);

    if (!categories || categories.length === 0) throw new CustomError("No categories found", 404);

    const response = {
        categories,
        meta: {
            count: categories.length,
            page,
            limit,
            totalPages: Math.ceil(total / Number(limit)),
            totalItems: total
        }
    };

    res.json({ success: true, message: 'Categories fetched successfully', data: response });
});


// GET /api/categories/:id
export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const category: Category | null = await prisma.category.findUnique({
        where: { id },
        include: {
            parent: true,
            children: true,
        }
    });

    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    res.json({ success: true, message: 'Category fetched successfully', data: category });
});

export const searchCategories = asyncHandler(async (req: Request, res: Response) => {
    if (!req.query) throw new CustomError("Query parameters are required", 400);
    const { q, page, limit } = req.query;

    if (!q) throw new CustomError("query is required", 400);

    if (!q || typeof q !== "string") throw new CustomError("Category name is required and must be a string", 400);

    const categories = await paginate({ model: "category", page: Number(page) || 1, limit: Number(limit) || 10, where: { name: { contains: q, mode: "insensitive" } } });

    // console.log(categories.ca, "categories length");
    if (!categories) return res.status(404).json({ success: false, message: 'No categories found for the query' });

    res.json({ success: true, message: 'Categories fetched successfully', data: categories });
});


// PUT /api/categories/:id
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new CustomError("Category ID is required", 400);

    const existingCategory: Category | null = await prisma.category.findUnique({ where: { id } });
    if (!existingCategory) return res.status(404).json({ success: false, message: 'Category not found' });

    if (!req.body) throw new CustomError("No data provided for update", 400);
    const { name, parentId } = req.body;

    const updateData: ICategory = {};

    if (name) updateData.name = name;
    if (parentId) updateData.parentId = parentId || null; // null for top-level

    if (Object.keys(updateData).length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });

    const updated: Category = await prisma.category.update({
        where: { id },
        data: updateData,
    });

    res.json({ success: true, message: 'Category updated successfully', data: updated });
});


// DELETE /api/categories/:id
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new CustomError("Category ID is required", 400);

    const existingCategory: Category | null = await prisma.category.findUnique({ where: { id } });
    if (!existingCategory) return res.status(404).json({ success: false, message: 'Category not found' });

    await prisma.category.delete({ where: { id } });

    res.json({ success: true, message: 'Category deleted successfully' });
});

