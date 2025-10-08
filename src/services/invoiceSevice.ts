import prisma from "../models/prisma-client";
import CustomError from "../utils/CustomError";

export const generateInvoiceHTMLService = async (saleId: string): Promise<string> => {
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

  return invoiceHTML;
};
