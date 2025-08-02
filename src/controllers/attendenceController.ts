import prisma from "../models/prisma-client";
import asyncHandler from "../utils/asyncHandler";
import { Request, Response } from "express";
import { UserPayload } from "../types/jwtInterface";
import CustomError from "../utils/CustomError";

export const checkIn = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.user as UserPayload)?.id || "system"; // Assuming req.user is set by authentication middleware

    // const user = await prisma.user.findUnique({ where: { id: userId }, include: { shop: true } });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const today = new Date();
    // const weekday = today.getDay();

    // Check for weekend
    // const isWeekend = await prisma.weeklyOff.findFirst({
    //     where: { shopId: user.shopId, weekday },
    // });

    // if (isWeekend) {
    //     return res.status(400).json({ message: "Today is a weekend" });
    // }

    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const existing = await prisma.attendance.findFirst({
        where: { userId, date: { gte: startOfDay } },
    });

    if (existing?.isCheckedIn) return res.status(400).json({ message: "Already checked in" });

    const attendance = await prisma.attendance.upsert({
        where: {
            userId_date: {
                userId,
                date: startOfDay,
            },
        },
        update: { isCheckedIn: true, status: "PRESENT" },
        create: {
            userId,
            date: new Date(),
            checkIn: new Date(),
            status: "PRESENT",
        },
    });

    res.json({ status: "success", message: "Checked in successfully", attendance });
});

export const checkOut = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.user as UserPayload)?.id || "system"; // Assuming req.user is set by authentication middleware
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    const attendance = await prisma.attendance.findFirst({
        where: { userId, date: { gte: startOfDay } },
    });

    if (!attendance?.checkIn || attendance?.checkOut) return res.status(400).json({ message: "Invalid check-out" });


    const checkOut = new Date();
    const workedHours = (checkOut.getTime() - attendance.checkIn.getTime()) / (1000 * 60 * 60);

    const updated = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
            checkOut,
            workedHours: parseFloat(workedHours.toFixed(2)),
        },
    });

    res.json({ message: "Checked out", updated });
});

export const reportById = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { start, end } = req.query;

    if (!userId) throw new CustomError("User ID is required", 400);
    if (!start || !end) throw new CustomError("Start and end dates are required", 400);

    const startDate = new Date(start as string);
    const endDate = new Date(end as string);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new CustomError("Invalid date format", 400);
    }

    const logs = await prisma.attendance.findMany({
        where: {
            userId,
            date: {
                gte: startDate,
                lte: endDate,
            },
        },
        orderBy: { date: "asc" },
    });

    res.status(200).json({
        success: true,
        message: "Attendance report retrieved successfully",
        data: logs.map((a) => ({
            date: a.date.toISOString().split("T")[0],
            status: a.status,
            checkIn: a.checkIn,
            checkOut: a.checkOut,
            hours: a.workedHours,
        })),
    });
});


