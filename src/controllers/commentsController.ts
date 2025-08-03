import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import prisma from "../models/prisma-client";
import { paginate } from "../utils/paginatedResponse";

export const createComment = asyncHandler(async (req: Request, res: Response) => {
    const { comment, productId } = req.body;

    if (!comment || !productId) return res.status(400).json({ message: 'Missing required fields' });

    const product = await prisma.products.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const newComment = await prisma.comments.create({
        data: { comment, productId },
    });

    res.status(201).json({ success: true, message: "Comment created successfully", data: newComment });

});

export const getCommentsByProductId = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const { page, limit } = req.query;

    if (!productId) return res.status(400).json({ message: 'Missing required fields' });

    const comments = await paginate({ model: "comments", page: Number(page || 1), limit: Number(limit || 10), where: { productId } });

    const responseData = {
        comments: comments.data,
        meta: comments.meta
    };

    res.json({ success: true, message: "Comments fetched successfully", data: responseData });
});


export const getComment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'Missing required fields' });

    const comment = await prisma.comments.findUnique({ where: { id } });
    res.json({ success: true, message: "Comment fetched successfully", data: comment });
});

export const updateComment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { comment } = req.body;

    if (!id) return res.status(400).json({ message: 'Missing required fields' });

    const existingComment = await prisma.comments.findUnique({ where: { id } });
    if (!existingComment) return res.status(404).json({ message: 'Comment not found' });

    const comments = await prisma.comments.update({
        where: { id },
        data: { comment },
    });

    res.json({ success: true, message: "Comment updated successfully", data: comments });

});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {

    const { id } = req.params;

    if (!id) return res.status(400).json({ message: 'Missing required fields' });

    const existingComment = await prisma.comments.findUnique({ where: { id } });
    if (!existingComment) return res.status(404).json({ message: 'Comment not found' });

    await prisma.comments.delete({ where: { id } });

    res.json({ success: true, message: "Comment deleted successfully" });
});