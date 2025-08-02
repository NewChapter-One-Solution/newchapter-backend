import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/asyncHandler";
import CustomError from "../utils/CustomError";
import prisma from "../models/prisma-client";
import { UserPayload } from "../types/jwtInterface";
import { paginate } from "../utils/paginatedResponse";

// Get invoice by sale ID
export const getInvoiceBySaleId = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { saleId } = req.params;

    if (!saleId) {
      throw new CustomError("Sale ID is required", 400);
    }

    const sale = await prisma.sales.findUnique({
      where: { id: saleId },
      include: {
        saleItems: {
          include: {
            product: {
              select: {
                name: true,
                price: true,
                description: true,
                category: {
                  select: { name: true }
                }
              },
            },
          },
        },
        customer: true,
        shop: {
          select: {
            name: true,
            location: true,
          },
        },
      },
    });

    if (!sale) {
      throw new CustomError("Sale not found", 404);
    }

    // Calculate invoice details
    const subtotal = sale.saleItems.reduce((sum, item) =>
      sum + (item.quantity * item.unitPrice), 0
    );

    const discount = subtotal - sale.totalAmount;
    const discountPercentage = subtotal > 0 ? (discount / subtotal) * 100 : 0;

    const invoiceData = {
      invoiceNo: sale.invoiceNo,
      saleDate: sale.saleDate,
      customer: sale.customer,
      shop: sale.shop,
      items: sale.saleItems.map(item => ({
        productName: item.product.name,
        productDescription: item.product.description,
        category: item.product.category?.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
      })),
      subtotal,
      discount,
      discountPercentage: Math.round(discountPercentage * 100) / 100,
      totalAmount: sale.totalAmount,
      paymentMode: sale.paymentMode,
    };

    res.status(200).json({
      success: true,
      message: "Invoice retrieved successfully",
      data: invoiceData,
    });
  }
);

// Get invoice by invoice number
export const getInvoiceByNumber = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { invoiceNo } = req.params;

    if (!invoiceNo) {
      throw new CustomError("Invoice number is required", 400);
    }

    const sale = await prisma.sales.findUnique({
      where: { invoiceNo },
      include: {
        saleItems: {
          include: {
            product: {
              select: {
                name: true,
                price: true,
                description: true,
                category: {
                  select: { name: true }
                }
              },
            },
          },
        },
        customer: true,
        shop: {
          select: {
            name: true,
            location: true,
          },
        },
      },
    });

    if (!sale) {
      throw new CustomError("Invoice not found", 404);
    }

    // Calculate invoice details
    const subtotal = sale.saleItems.reduce((sum, item) =>
      sum + (item.quantity * item.unitPrice), 0
    );

    const discount = subtotal - sale.totalAmount;
    const discountPercentage = subtotal > 0 ? (discount / subtotal) * 100 : 0;

    const invoiceData = {
      invoiceNo: sale.invoiceNo,
      saleDate: sale.saleDate,
      customer: sale.customer,
      shop: sale.shop,
      items: sale.saleItems.map(item => ({
        productName: item.product.name,
        productDescription: item.product.description,
        category: item.product.category?.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
      })),
      subtotal,
      discount,
      discountPercentage: Math.round(discountPercentage * 100) / 100,
      totalAmount: sale.totalAmount,
      paymentMode: sale.paymentMode,
    };

    res.status(200).json({
      success: true,
      message: "Invoice retrieved successfully",
      data: invoiceData,
    });
  }
);

// Get all invoices with pagination
export const getAllInvoices = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      page = 1,
      limit = 10,
      shopId,
      startDate,
      endDate,
      customerId,
      search
    } = req.query;

    const where: any = {};

    if (shopId) {
      where.shopId = shopId as string;
    }

    if (customerId) {
      where.customerId = customerId as string;
    }

    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) {
        where.saleDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.saleDate.lte = new Date(endDate as string);
      }
    }

    if (search) {
      where.OR = [
        { invoiceNo: { contains: search as string, mode: "insensitive" } },
        { customer: { name: { contains: search as string, mode: "insensitive" } } },
        { customer: { phone: { contains: search as string } } },
      ];
    }

    const invoices = await paginate({
      model: "sales",
      page: Number(page),
      limit: Number(limit),
      where,
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
        shop: {
          select: {
            name: true,
          },
        },
        saleItems: {
          select: {
            quantity: true,
            unitPrice: true,
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { saleDate: "desc" },
    });

    // Transform data to include invoice summary
    const transformedInvoices = {
      ...invoices,
      data: invoices.data.map((sale: any) => ({
        id: sale.id,
        invoiceNo: sale.invoiceNo,
        saleDate: sale.saleDate,
        customer: sale.customer,
        shop: sale.shop,
        totalAmount: sale.totalAmount,
        paymentMode: sale.paymentMode,
        itemCount: sale.saleItems.length,
        itemsSummary: sale.saleItems.map((item: any) =>
          `${item.product.name} (${item.quantity})`
        ).join(", "),
      })),
    };

    res.status(200).json({
      success: true,
      message: "Invoices retrieved successfully",
      data: transformedInvoices,
    });
  }
);

// Generate invoice HTML for printing/PDF
// export const generateInvoiceHTML = asyncHandler(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const { saleId } = req.params;

//     if (!saleId) {
//       throw new CustomError("Sale ID is required", 400);
//     }

//     const sale = await prisma.sales.findUnique({
//       where: { id: saleId },
//       include: {
//         saleItems: {
//           include: {
//             product: {
//               select: {
//                 name: true,
//                 price: true,
//                 description: true,
//                 category: {
//                   select: { name: true }
//                 }
//               },
//             },
//           },
//         },
//         customer: true,
//         shop: {
//           select: {
//             name: true,
//             location: true,
//           },
//         },
//       },
//     });

//     if (!sale) {
//       throw new CustomError("Sale not found", 404);
//     }

//     // Calculate invoice details
//     const subtotal = sale.saleItems.reduce((sum, item) =>
//       sum + (item.quantity * item.unitPrice), 0
//     );

//     const discount = subtotal - sale.totalAmount;
//     const discountPercentage = subtotal > 0 ? (discount / subtotal) * 100 : 0;

//     // Generate HTML invoice
//     const invoiceHTML = `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Invoice ${sale.invoiceNo}</title>
//         <style>
//             body {
//                 font-family: Arial, sans-serif;
//                 margin: 0;
//                 padding: 20px;
//                 color: #333;
//             }
//             .invoice-container {
//                 max-width: 800px;
//                 margin: 0 auto;
//                 border: 1px solid #ddd;
//                 padding: 20px;
//             }
//             .header {
//                 text-align: center;
//                 border-bottom: 2px solid #333;
//                 padding-bottom: 20px;
//                 margin-bottom: 30px;
//             }
//             .shop-name {
//                 font-size: 28px;
//                 font-weight: bold;
//                 color: #2c3e50;
//                 margin-bottom: 5px;
//             }
//             .shop-address {
//                 font-size: 14px;
//                 color: #666;
//             }
//             .invoice-details {
//                 display: flex;
//                 justify-content: space-between;
//                 margin-bottom: 30px;
//             }
//             .invoice-info, .customer-info {
//                 width: 48%;
//             }
//             .invoice-info h3, .customer-info h3 {
//                 margin-top: 0;
//                 color: #2c3e50;
//                 border-bottom: 1px solid #eee;
//                 padding-bottom: 5px;
//             }
//             .items-table {
//                 width: 100%;
//                 border-collapse: collapse;
//                 margin-bottom: 20px;
//             }
//             .items-table th, .items-table td {
//                 border: 1px solid #ddd;
//                 padding: 12px;
//                 text-align: left;
//             }
//             .items-table th {
//                 background-color: #f8f9fa;
//                 font-weight: bold;
//                 color: #2c3e50;
//             }
//             .items-table .text-right {
//                 text-align: right;
//             }
//             .totals {
//                 float: right;
//                 width: 300px;
//                 margin-top: 20px;
//             }
//             .totals table {
//                 width: 100%;
//                 border-collapse: collapse;
//             }
//             .totals td {
//                 padding: 8px;
//                 border-bottom: 1px solid #eee;
//             }
//             .totals .total-row {
//                 font-weight: bold;
//                 font-size: 16px;
//                 border-top: 2px solid #333;
//                 background-color: #f8f9fa;
//             }
//             .footer {
//                 clear: both;
//                 margin-top: 50px;
//                 text-align: center;
//                 font-size: 12px;
//                 color: #666;
//                 border-top: 1px solid #eee;
//                 padding-top: 20px;
//             }
//             .payment-info {
//                 margin-top: 20px;
//                 padding: 15px;
//                 background-color: #f8f9fa;
//                 border-radius: 5px;
//             }
//             @media print {
//                 body { margin: 0; }
//                 .invoice-container { border: none; }
//             }
//         </style>
//     </head>
//     <body>
//         <div class="invoice-container">
//             <div class="header">
//                 <div class="shop-name">${sale.shop.name}</div>
//                 <div class="shop-address">${sale.shop.location}</div>
//                 <div style="margin-top: 15px; font-size: 24px; color: #e74c3c;">
//                     <strong>INVOICE</strong>
//                 </div>
//             </div>

//             <div class="invoice-details">
//                 <div class="invoice-info">
//                     <h3>Invoice Details</h3>
//                     <p><strong>Invoice No:</strong> ${sale.invoiceNo}</p>
//                     <p><strong>Date:</strong> ${new Date(sale.saleDate).toLocaleDateString()}</p>
//                     <p><strong>Payment Mode:</strong> ${sale.paymentMode}</p>
//                 </div>
//                 <div class="customer-info">
//                     <h3>Bill To</h3>
//                     <p><strong>${sale.customer.name}</strong></p>
//                     <p>Phone: ${sale.customer.phone}</p>
//                     ${sale.customer.email ? `<p>Email: ${sale.customer.email}</p>` : ''}
//                     ${sale.customer.address ? `<p>Address: ${sale.customer.address}</p>` : ''}
//                 </div>
//             </div>

//             <table class="items-table">
//                 <thead>
//                     <tr>
//                         <th>Item</th>
//                         <th>Category</th>
//                         <th class="text-right">Qty</th>
//                         <th class="text-right">Unit Price</th>
//                         <th class="text-right">Total</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     ${sale.saleItems.map(item => `
//                         <tr>
//                             <td>
//                                 <strong>${item.product.name}</strong>
//                                 ${item.product.description ? `<br><small style="color: #666;">${item.product.description}</small>` : ''}
//                             </td>
//                             <td>${item.product.category?.name || 'N/A'}</td>
//                             <td class="text-right">${item.quantity}</td>
//                             <td class="text-right">$${item.unitPrice.toFixed(2)}</td>
//                             <td class="text-right">$${(item.quantity * item.unitPrice).toFixed(2)}</td>
//                         </tr>
//                     `).join('')}
//                 </tbody>
//             </table>

//             <div class="totals">
//                 <table>
//                     <tr>
//                         <td>Subtotal:</td>
//                         <td class="text-right">$${subtotal.toFixed(2)}</td>
//                     </tr>
//                     ${discount > 0 ? `
//                         <tr>
//                             <td>Discount (${discountPercentage.toFixed(1)}%):</td>
//                             <td class="text-right">-$${discount.toFixed(2)}</td>
//                         </tr>
//                     ` : ''}
//                     <tr class="total-row">
//                         <td>Total Amount:</td>
//                         <td class="text-right">$${sale.totalAmount.toFixed(2)}</td>
//                     </tr>
//                 </table>
//             </div>

//             <div class="payment-info">
//                 <strong>Payment Method:</strong> ${sale.paymentMode}
//                 <br>
//                 <strong>Status:</strong> Paid
//             </div>

//             <div class="footer">
//                 <p>Thank you for your business!</p>
//                 <p>This is a computer-generated invoice and does not require a signature.</p>
//                 <p>Generated on ${new Date().toLocaleString()}</p>
//             </div>
//         </div>
//     </body>
//     </html>
//     `;

//     res.setHeader('Content-Type', 'text/html');
//     res.status(200).send(invoiceHTML);
//   }
// );

// Get invoice statistics
export const getInvoiceStatistics = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { shopId, period = "month" } = req.query;

    let dateFilter: any = {};
    const now = new Date();

    switch (period) {
      case "day":
        dateFilter = {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        };
        break;
      case "week":
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        dateFilter = { gte: weekStart };
        break;
      case "month":
        dateFilter = {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
        };
        break;
      case "year":
        dateFilter = {
          gte: new Date(now.getFullYear(), 0, 1),
        };
        break;
    }

    const where: any = { saleDate: dateFilter };
    if (shopId) {
      where.shopId = shopId as string;
    }

    const [
      totalInvoices,
      totalRevenue,
      averageInvoiceValue,
      paymentModeStats,
    ] = await Promise.all([
      // Total invoices
      prisma.sales.count({ where }),

      // Total revenue
      prisma.sales.aggregate({
        where,
        _sum: { totalAmount: true },
      }),

      // Average invoice value
      prisma.sales.aggregate({
        where,
        _avg: { totalAmount: true },
      }),

      // Payment mode statistics
      prisma.sales.groupBy({
        by: ["paymentMode"],
        where,
        _count: { paymentMode: true },
        _sum: { totalAmount: true },
      }),
    ]);

    const paymentStats = paymentModeStats.map(stat => ({
      paymentMode: stat.paymentMode,
      count: stat._count.paymentMode,
      totalAmount: stat._sum.totalAmount || 0,
    }));

    res.status(200).json({
      success: true,
      message: "Invoice statistics retrieved successfully",
      data: {
        totalInvoices,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        averageInvoiceValue: averageInvoiceValue._avg.totalAmount || 0,
        paymentModeBreakdown: paymentStats,
        period,
      },
    });
  }
);

export const generateInvoiceHTML = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { saleId } = req.params;

    if (!saleId) {
      throw new CustomError("Sale ID is required", 400);
    }

    const sale = await prisma.sales.findUnique({
      where: { id: saleId },
      include: {
        saleItems: {
          include: {
            product: {
              select: {
                name: true,
                price: true,
                description: true,
                category: { select: { name: true } },
              },
            },
          },
        },
        customer: true,
        shop: { select: { name: true, location: true } },
      },
    });

    if (!sale) {
      throw new CustomError("Sale not found", 404);
    }

    const taxable = sale.saleItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    const discount = taxable - sale.totalAmount;
    const gstRate = 18;
    const invoiceDate = new Date(sale.saleDate).toISOString().split("T")[0];

    const invoiceHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Tax Invoice</title>
</head>
<body style="font-family: Arial, sans-serif; font-size: 14px; color: #333; margin: 0; padding: 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 700px; margin: auto; border: 1px solid #ddd; padding: 20px;">
    <tr>
      <td align="center" colspan="2" style="font-size: 22px; font-weight: bold; padding-bottom: 10px;">TAX INVOICE</td>
    </tr>
    <tr>
      <td colspan="2" style="padding-bottom: 15px;">
        <strong>Invoice No:</strong> ${sale.invoiceNo}<br />
        <strong>Invoice Date:</strong> ${invoiceDate}<br />
        <strong>Due Date:</strong> -
      </td>
    </tr>

    <tr>
      <td valign="top" width="50%" style="padding-right: 10px;">
        <strong>Billed By:</strong><br />
        ${sale.shop.name}<br />
        Phone: -<br />
        GSTIN: -<br />
        PAN: -<br />
        ${sale.shop.location || "-"}
      </td>
      <td valign="top" width="50%">
        <strong>Billed To:</strong><br />
        ${sale.customer.name}<br />
        Phone: ${sale.customer.phone || "-"}<br />
        GSTIN: -<br />
        ${sale.customer.address || "-"}
      </td>
    </tr>

    <tr>
      <td colspan="2" style="padding: 20px 0;">
        <table width="100%" cellpadding="5" cellspacing="0" border="1" style="border-collapse: collapse;">
          <thead style="background: #f0f0f0;">
            <tr>
              <th>Item</th>
              <th>HSN/SAC</th>
              <th>Rate</th>
              <th>Qty</th>
              <th>Taxable</th>
              <th>GST%</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.saleItems
        .map((item) => {
          const lineTaxable = item.unitPrice * item.quantity;
          const lineTotal = lineTaxable * (1 + gstRate / 100);
          return `
              <tr>
                <td>${item.product.name}</td>
                <td>9403</td>
                <td>${item.unitPrice.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>${lineTaxable.toFixed(2)}</td>
                <td>${gstRate}</td>
                <td>${lineTotal.toFixed(2)}</td>
              </tr>
            `;
        })
        .join("")}
          </tbody>
        </table>
      </td>
    </tr>

    <tr>
      <td colspan="2" align="right">
        <table cellpadding="5" cellspacing="0" style="width: 300px;">
          <tr><td>Taxable Value</td><td align="right">₹${taxable.toFixed(2)}</td></tr>
          <tr><td>Subtotal</td><td align="right">₹${(taxable * 1.18).toFixed(2)}</td></tr>
          <tr><td>Discount</td><td align="right">₹${discount.toFixed(2)}</td></tr>
          <tr><td><strong>Total</strong></td><td align="right"><strong>₹${sale.totalAmount.toFixed(2)}</strong></td></tr>
          <tr><td>Amount Paid</td><td align="right">₹0.00</td></tr>
          <tr><td><strong>Balance Due</strong></td><td align="right"><strong>₹${sale.totalAmount.toFixed(2)}</strong></td></tr>
        </table>
      </td>
    </tr>

    <tr>
      <td colspan="2" style="padding-top: 20px; font-size: 12px; line-height: 18px;">
        <strong>Terms and Conditions:</strong><br />
        1. Please pay within 15 days from the invoice date. Overdue interest @14% will apply.<br />
        2. Always quote invoice number when making payments.<br />
        3. Goods once sold cannot be returned.
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(invoiceHTML);
  }
);

