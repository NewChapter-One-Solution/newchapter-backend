import { Request, Response } from "express";
import asyncHandler from "../helpers/asyncHandler";
import CustomError from "../helpers/CustomError";
import prisma from "../db/prisma-client";
import { Products } from "../../generated/prisma";
import { UserPayload } from "../interfaces/jwtInterface";
import { deleteImageFromCloudnary, uploadToCloudinary } from "../config/cloudinary";
import { paginate } from "../utils/paginatedResponse";


export const createProduct = asyncHandler(async (req: Request, res: Response) => {

    const { name, categoryId, description, slug, price, color, size, suppliersId, material, weight } = req.body;

    const createdBy = (req.user as UserPayload)?.id || "system"; // Assuming req.user is set by authentication middleware

    if (!name || !categoryId || !suppliersId) throw new CustomError("name, categoryId, and suppliersId are required", 400);

    const createProductData: any = { name, suppliersId, createdBy, imageDetails: { publicId: String, url: String } };

    if (typeof categoryId !== "undefined") createProductData.categoryId = categoryId;
    if (description) createProductData.description = description;
    if (slug) createProductData.slug = slug;
    if (price) createProductData.price = price;
    if (color) createProductData.color = color;
    if (size) createProductData.size = size;
    if (material) createProductData.material = material;
    if (weight) createProductData.weight = weight;

    // call cloudenary for upload the image to cloudinary

    if (req.file && req.file.path) {
        const uploadedImageDetails = await uploadToCloudinary(req.file.path);
        console.log(uploadedImageDetails);

        if (uploadedImageDetails) {
            createProductData.imageDetails.publicId = uploadedImageDetails.public_id;
            createProductData.imageDetails.url = uploadedImageDetails.secure_url;
        }

    }


    const product: Products = await prisma.products.create({
        data: createProductData
    });

    res.status(201).json({ success: true, status: 201, message: "Product created successfully", data: product });

});

export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;

    // const products = await prisma.products.findMany();

    const products = await paginate({
        model: "products",
        page: Number(page),
        limit: Number(limit),
    });

    const responseData = {
        products: products.data,
        meta: products.meta
    };

    res.status(200).json({ success: true, status: 200, message: "Products fetched successfully", data: responseData });

});

export const getProductBy = asyncHandler(async (req: Request, res: Response) => {

    if (!req.params) throw new CustomError("valid payload is required", 400);

    const { id } = req.params;
    if (!id) throw new CustomError("Product ID is required", 400);

    const product: Products | null = await prisma.products.findUnique({ where: { id } });
    if (!product) throw new CustomError("Product not found", 404);

    res.status(200).json({ success: true, status: 200, message: "Product fetched successfully", data: product });

});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
    console.log(req.params);
    const { id } = req.params;
    if (!id) throw new CustomError("Product ID is required", 400);
    console.log(req.body);

    if (!req.body) throw new CustomError("Valid payload is required", 400);
    const { name, categoryId, description, slug, price, color, size, suppliersId } = req.body;

    // check if product is exists
    const existsProduct = await prisma.products.findUnique({ where: { id } });
    if (!existsProduct) throw new CustomError("Product not found", 404);

    const updateProductData: any = {};

    if (name) updateProductData.name = name;
    if (categoryId) updateProductData.categoryId = categoryId;
    if (description) updateProductData.description = description;
    if (slug) updateProductData.slug = slug;
    if (price) updateProductData.price = price;
    if (color) updateProductData.color = color;
    if (size) updateProductData.size = size;
    if (suppliersId) updateProductData.suppliersId = suppliersId;

    if (req.file && req.file.path) {
        let publicId: string | undefined = undefined;
        if (
            existsProduct?.imageDetails &&
            typeof existsProduct.imageDetails === "object" &&
            "publicId" in existsProduct.imageDetails
        ) publicId = (existsProduct.imageDetails as { publicId?: string; }).publicId;

        await deleteImageFromCloudnary(String(publicId));

        const uploadedImageDetails = await uploadToCloudinary(req.file.path);

        if (uploadedImageDetails) {
            updateProductData.imageDetails = {
                publicId: uploadedImageDetails.public_id,
                url: uploadedImageDetails.secure_url
            };
        }
        const product: Products | null = await prisma.products.update({
            where: { id },
            data: updateProductData
        });

        res.status(200).json({ success: true, status: 200, message: "Product updated successfully", data: product });
    }

});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new CustomError("Product ID is required", 400);

    await prisma.products.delete({ where: { id } });

    res.status(204).json({ success: true, status: 204, message: "Product deleted successfully" });
});


