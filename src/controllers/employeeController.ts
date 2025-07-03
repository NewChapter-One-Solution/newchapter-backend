import { Request, Response } from "express";
import asyncHandler from "../helpers/asyncHandler";
import prisma from "../db/prisma-client";
import { paginate } from "../utils/paginatedResponse";

export const getEmployees = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, sort } = req.query;
    const sortOrder = (sort === 'asc' || sort === 'desc') ? sort : 'desc';

    const employees = await paginate({
        model: "user",
        page: Number(page),
        limit: Number(limit),
        where: {
            role: {
                not: "ADMIN"
            }
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            department: true,
            role: true,
            shop: { select: { id: true, name: true } },
        },
        orderBy: { "createdAt": sortOrder },
    });

    const responseData = {
        employees: employees.data,
        meta: employees.meta
    };
    res.json({ success: true, message: 'Employees fetched successfully', data: responseData });
});

export const assignEmployeeToShop = asyncHandler(async (req: Request, res: Response) => {
    const { employeeId, shopId, department, role, joinDate } = req.body;

    if (!employeeId || !shopId) throw new Error('Employee ID and Shop ID are required');

    const [employee, shop] = await Promise.all([prisma.user.findUnique({ where: { id: employeeId } }), prisma.shop.findUnique({ where: { id: shopId } })]);

    if (!employee) throw new Error('Employee not found');
    if (!shop) throw new Error('Shop not found');

    // check if employee is already assigned to another shop
    if (employee.shopId) throw new Error('Employee is already assigned to another shop');

    const updatedEmployee = await prisma.user.update({
        where: { id: employeeId },
        data: {
            shopId,
            department,
            role,
            joinDate,
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            department: true,
            role: true,
            shop: { select: { id: true, name: true } },
        },
    });

    await prisma.shop.update({
        where: { id: shopId },
        data: {
            attendees: {
                connect: { id: employeeId },
            },
        },
    });



    res.json({ success: true, message: 'Employee assigned to shop successfully', data: updatedEmployee });
});

export const removeEmployeeFromShop = asyncHandler(async (req: Request, res: Response) => {
    const { employeeId, shopId } = req.body;

    if (!employeeId || !shopId) throw new Error('Employee ID and Shop ID are required');

    const [employee, shop] = await Promise.all([prisma.user.findUnique({ where: { id: employeeId } }), prisma.shop.findUnique({ where: { id: shopId } })]);

    if (!employee) throw new Error('Employee not found');
    if (!shop) throw new Error('Shop not found');

    const updatedEmployee = await prisma.user.update({
        where: { id: employeeId },
        data: {
            shopId: null,
            department: null,
            role: "STAFF",
            joinDate: null,
        },
    });

    // await prisma.shop.update({
    //     where: { id: shopId },
    //     data: {
    //         attendees: {
    //             set: shop.attendees.filter((id: string) => id !== employeeId),
    //         },
    //     },
    // });
    await prisma.shop.update({
        where: { id: shopId },
        data: {
            attendees: {
                disconnect: { id: employeeId },
            },
        },
    });

    res.json({ success: true, message: 'Employee removed from shop successfully', data: updatedEmployee });

});

export const getAllShopEmployee = asyncHandler(async (req: Request, res: Response) => {
    const { shopId } = req.params;
    const { page = 1, limit = 10, sort } = req.query;
    const sortOrder = (sort === 'asc' || sort === 'desc') ? sort : 'desc';

    // const shop = await prisma.shop.findUnique({
    //     where: { id: shopId },
    //     include: {
    //         attendees: {
    //             select: {
    //                 id: true,
    //                 email: true,
    //                 firstName: true,
    //                 department: true,
    //                 role: true,
    //                 shop: { select: { id: true, name: true } },
    //             }
    //         }
    //     }
    // });

    const attendees = await paginate({
        model: "user",
        page: Number(page),
        limit: Number(limit),
        where: { shopId }, // or add more filters like role, department, etc.
        select: {
            id: true,
            email: true,
            firstName: true,
            department: true,
            role: true,
            shop: { select: { id: true, name: true } },
        },
        orderBy: { "createdAt": sortOrder }, // optional
    });

    if (!attendees) throw new Error('Shop not found');

    const responseData = {
        employees: attendees.data,
        meta: attendees.meta
    };

    res.json({ success: true, message: 'Shop employees fetched successfully', data: responseData });

});