import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import CustomError from "../utils/CustomError";
import prisma from "../models/prisma-client";
import { Products } from "../../generated/prisma";
import { UserPayload } from "../types/jwtInterface";
import {
  deleteImageFromCloudnary,
  uploadToCloudinary,
} from "../config/cloudinary";
import { paginate } from "../utils/paginatedResponse";

export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      name,
      categoryId,
      description,
      slug,
      price,
      color,
      size,
      suppliersId,
      material,
      weight,
    } = req.body;

    const createdBy = (req.user as UserPayload)?.id || "system"; // Assuming req.user is set by authentication middleware

    if (!name || !categoryId || !suppliersId)
      throw new CustomError(
        "name, categoryId, and suppliersId are required",
        400
      );


    // check if category  and suppliers exists or not 
    const [category, suppliers] = await Promise.all([
      prisma.category.findUnique({
        where: { id: categoryId },
      }),
      prisma.suppliers.findUnique({
        where: { id: suppliersId },
      }),
    ]);
    if (!category) throw new CustomError("Category not found", 404);
    if (!suppliers) throw new CustomError("Suppliers not found", 404);

    const createProductData: any = {
      name,
      suppliersId,
      createdBy,
      imageDetails: { publicId: String, url: String },
    };

    if (typeof categoryId !== "undefined")
      createProductData.categoryId = categoryId;
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
        createProductData.imageDetails.publicId =
          uploadedImageDetails.public_id;
        createProductData.imageDetails.url = uploadedImageDetails.secure_url;
      }
    }

    const product: Products = await prisma.products.create({
      data: createProductData,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  }
);

export const getAllProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;

    const products = await paginate({
      model: "products",
      page: Number(page),
      limit: Number(limit),
    });

    const responseData = {
      products: products.data,
      meta: products.meta,
    };

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: responseData,
    });
  }
);

export const getProductBy = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.params) throw new CustomError("valid payload is required", 400);

    const { id } = req.params;
    if (!id) throw new CustomError("Product ID is required", 400);

    const product = await prisma.products.findUnique({
      where: { id },
    });

    if (!product) throw new CustomError("Product not found", 404);

    res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: product,
    });
  }
);

export const updateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    console.log(req.params);
    const { id } = req.params;
    if (!id) throw new CustomError("Product ID is required", 400);
    console.log(req.body);

    if (!req.body) throw new CustomError("Valid payload is required", 400);
    const {
      name,
      categoryId,
      description,
      slug,
      price,
      color,
      size,
      suppliersId,
      material,
      weight,
      warehouseId,
    } = req.body;

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
    if (material) updateProductData.material = material;
    if (weight) updateProductData.weight = weight;
    if (warehouseId) updateProductData.warehouseId = warehouseId;

    if (req.file && req.file.path) {
      let publicId: string | undefined = undefined;
      if (
        existsProduct?.imageDetails &&
        typeof existsProduct.imageDetails === "object" &&
        "publicId" in existsProduct.imageDetails
      )
        publicId = (existsProduct.imageDetails as { publicId?: string })
          .publicId;

      await deleteImageFromCloudnary(String(publicId));

      const uploadedImageDetails = await uploadToCloudinary(req.file.path);

      if (uploadedImageDetails) {
        updateProductData.imageDetails = {
          publicId: uploadedImageDetails.public_id,
          url: uploadedImageDetails.secure_url,
        };
      }
    }
    const product: Products | null = await prisma.products.update({
      where: { id },
      data: updateProductData,
    });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  }

);

export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new CustomError("Product ID is required", 400);

    await prisma.products.delete({ where: { id } });

    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  }
);
