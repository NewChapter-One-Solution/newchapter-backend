import { sendEmail } from '../config/nodemailer';
import prisma from '../models/prisma-client';
import CustomError from '../utils/CustomError';
import logger from '../utils/logger';

interface InvoiceEmailData {
    saleId: string;
    customerEmail: string;
    customerName: string;
    invoiceNo: string;
    totalAmount: number;
    shopName: string;
}

export const invoiceEmailService = {
    // Send invoice email to customer
    async sendInvoiceEmail(saleId: string): Promise<boolean> {
        try {
            // Get sale details with all necessary information
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
                                    category: { select: { name: true } }
                                }
                            }
                        }
                    },
                    customer: true,
                    shop: {
                        select: {
                            name: true,
                            location: true
                        }
                    }
                }
            });

            if (!sale) {
                throw new CustomError('Sale not found', 404);
            }

            if (!sale.customer.email) {
                logger.warn(`Customer ${sale.customer.name} has no email address. Invoice not sent for sale ${saleId}`);
                return false;
            }

            // Generate invoice HTML
            const invoiceHTML = await this.generateInvoiceHTML(sale);

            // Send email
            const subject = `Invoice ${sale.invoiceNo} - ${sale.shop.name}`;
            const textContent = this.generateTextContent(sale);

            await sendEmail(
                sale.customer.email,
                subject,
                textContent,
                invoiceHTML
            );

            logger.info(`Invoice email sent successfully to ${sale.customer.email} for sale ${saleId}`);
            return true;

        } catch (error) {
            logger.error(`Failed to send invoice email for sale ${saleId}:`, error);
            throw error;
        }
    },

    // Generate HTML content for invoice email
    async generateInvoiceHTML(sale: any): Promise<string> {
        const subtotal = sale.saleItems.reduce((sum: number, item: any) =>
            sum + (item.quantity * item.unitPrice), 0
        );

        const discount = subtotal - sale.totalAmount;
        const discountPercentage = subtotal > 0 ? (discount / subtotal) * 100 : 0;
        const gstRate = 18;
        const totalWithGST = subtotal * (1 + gstRate / 100);
        const invoiceDate = new Date(sale.saleDate).toLocaleDateString();

        return `
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
                .map((item: any) => {
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
          <tr><td>Taxable Value</td><td align="right">₹${subtotal.toFixed(2)}</td></tr>
          <tr><td>Subtotal</td><td align="right">₹${totalWithGST.toFixed(2)}</td></tr>
          <tr><td>Discount</td><td align="right">₹${discount.toFixed(2)}</td></tr>
          <tr><td><strong>Total</strong></td><td align="right"><strong>₹${totalWithGST.toFixed(2)}</strong></td></tr>
        <tr><td>Amount Paid</td><td align="right">₹${totalWithGST.toFixed(2)}</td></tr>
          <tr><td><strong>Balance Due</strong></td><td align="right"><strong>₹0.00</strong></td></tr>
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
    },

    // Generate plain text content for email
    generateTextContent(sale: any): string {
        const subtotal = sale.saleItems.reduce((sum: number, item: any) =>
            sum + (item.quantity * item.unitPrice), 0
        );
        const discount = subtotal - sale.totalAmount;
        const invoiceDate = new Date(sale.saleDate).toLocaleDateString();

        let textContent = `
INVOICE FROM ${sale.shop.name.toUpperCase()}

Dear ${sale.customer.name},

Thank you for your recent purchase! Here are your invoice details:

INVOICE INFORMATION:
- Invoice Number: ${sale.invoiceNo}
- Invoice Date: ${invoiceDate}
- Payment Method: ${sale.paymentMode}
- Shop Location: ${sale.shop.location}

ITEMS PURCHASED:
`;

        sale.saleItems.forEach((item: any) => {
            textContent += `- ${item.product.name} x ${item.quantity} @ ₹${item.unitPrice.toFixed(2)} = ₹${(item.quantity * item.unitPrice).toFixed(2)}\n`;
        });

        textContent += `
PAYMENT SUMMARY:
- Subtotal: ₹${subtotal.toFixed(2)}`;

        if (discount > 0) {
            textContent += `
- Discount: -₹${discount.toFixed(2)}`;
        }

        textContent += `
- Total Amount: ₹${sale.totalAmount.toFixed(2)}

Thank you for choosing ${sale.shop.name}!
We appreciate your business and look forward to serving you again.

${sale.shop.location}

This is an automated email. Please do not reply to this message.
`;

        return textContent;
    },

    // Send invoice reminder email
    async sendInvoiceReminder(saleId: string, reminderType: 'payment' | 'followup' = 'followup'): Promise<boolean> {
        try {
            const sale = await prisma.sales.findUnique({
                where: { id: saleId },
                include: {
                    customer: true,
                    shop: { select: { name: true, location: true } }
                }
            });

            if (!sale || !sale.customer.email) {
                return false;
            }

            const subject = reminderType === 'payment'
                ? `Payment Reminder - Invoice ${sale.invoiceNo}`
                : `Thank you for your purchase - Invoice ${sale.invoiceNo}`;

            const htmlContent = this.generateReminderHTML(sale, reminderType);
            const textContent = this.generateReminderText(sale, reminderType);

            await sendEmail(
                sale.customer.email,
                subject,
                textContent,
                htmlContent
            );

            logger.info(`${reminderType} reminder email sent to ${sale.customer.email} for sale ${saleId}`);
            return true;

        } catch (error) {
            logger.error(`Failed to send ${reminderType} reminder email for sale ${saleId}:`, error);
            return false;
        }
    },

    // Generate reminder email HTML
    generateReminderHTML(sale: any, type: 'payment' | 'followup'): string {
        const isPaymentReminder = type === 'payment';

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${isPaymentReminder ? '#e74c3c' : '#27ae60'}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { padding: 15px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>${isPaymentReminder ? '💳 Payment Reminder' : '🙏 Thank You!'}</h2>
        </div>
        <div class="content">
            <p>Dear ${sale.customer.name},</p>
            
            ${isPaymentReminder ? `
                <p>This is a friendly reminder that your invoice <strong>${sale.invoiceNo}</strong> 
                for ₹${sale.totalAmount.toFixed(2)} is pending payment.</p>
                <p>Please make the payment at your earliest convenience.</p>
            ` : `
                <p>Thank you for your recent purchase from ${sale.shop.name}!</p>
                <p>We hope you're satisfied with your purchase. If you have any questions or concerns, 
                please don't hesitate to contact us.</p>
                <p>We look forward to serving you again!</p>
            `}
            
            <p><strong>Invoice Details:</strong></p>
            <ul>
                <li>Invoice Number: ${sale.invoiceNo}</li>
                <li>Amount: ₹${sale.totalAmount.toFixed(2)}</li>
                <li>Date: ${new Date(sale.saleDate).toLocaleDateString()}</li>
            </ul>
        </div>
        <div class="footer">
            <p>${sale.shop.name} | ${sale.shop.location}</p>
        </div>
    </div>
</body>
</html>`;
    },

    // Generate reminder email text
    generateReminderText(sale: any, type: 'payment' | 'followup'): string {
        const isPaymentReminder = type === 'payment';

        return `
Dear ${sale.customer.name},

${isPaymentReminder ?
                `This is a friendly reminder that your invoice ${sale.invoiceNo} for ₹${sale.totalAmount.toFixed(2)} is pending payment. Please make the payment at your earliest convenience.` :
                `Thank you for your recent purchase from ${sale.shop.name}! We hope you're satisfied with your purchase. If you have any questions or concerns, please don't hesitate to contact us.`
            }

Invoice Details:
- Invoice Number: ${sale.invoiceNo}
- Amount: ₹${sale.totalAmount.toFixed(2)}
- Date: ${new Date(sale.saleDate).toLocaleDateString()}

${sale.shop.name}
${sale.shop.location}
`;
    }
};

export default invoiceEmailService;