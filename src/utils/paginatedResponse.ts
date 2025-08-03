import prisma from "../models/prisma-client";

interface PaginationOptions<T> {
    model: keyof typeof prisma;
    page?: number;
    limit?: number;
    where?: T;
    orderBy?: any;
    include?: any;
    select?: any;
}



export async function paginate<T = any>({
    model,
    page = 1,
    limit = 10,
    where,
    orderBy,
    include,
    select,
}: PaginationOptions<T>) {
    const skip = (page - 1) * limit;
    const prismaModel = prisma[model] as any;

    const [data, total] = await prisma.$transaction([
        prismaModel.findMany({
            where,
            skip,
            take: limit,
            orderBy: orderBy ? (Array.isArray(orderBy) ? orderBy : [orderBy]) : undefined,
            include,
            select,
        }),
        prismaModel.count({ where }),
    ]);

    return {
        // ...(nameForData ? { [nameForData]: data } : { data }),
        data,
        meta: {
            count: Number(data.length),
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit),
            totalItems: Number(total)
        },
    };
}
