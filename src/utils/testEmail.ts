import { sendEmail } from '../config/nodemailer';
import logger from './logger';

// Test email configuration
export const testEmailConfiguration = async (testEmail: string): Promise<boolean> => {
    try {
        const testSubject = 'Test Email - Furniture Shop System';
        const testText = `
Hello!

This is a test email from your Furniture Shop Management System.

If you receive this email, your email configuration is working correctly.

Test Details:
- Date: ${new Date().toLocaleString()}
- System: Furniture Shop SaaS
- Status: Email configuration successful ✅

Best regards,
Furniture Shop System
    `;

        const testHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px; }
        .content { padding: 20px; background-color: #f9f9f9; margin: 10px 0; border-radius: 5px; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
        .success { color: #4CAF50; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>✅ Email Test Successful</h2>
        </div>
        <div class="content">
            <p>Hello!</p>
            <p>This is a test email from your <strong>Furniture Shop Management System</strong>.</p>
            <p>If you receive this email, your email configuration is working correctly.</p>
            
            <h3>Test Details:</h3>
            <ul>
                <li><strong>Date:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>System:</strong> Furniture Shop SaaS</li>
                <li><strong>Status:</strong> <span class="success">Email configuration successful ✅</span></li>
            </ul>
            
            <p>You can now send invoice emails to your customers automatically!</p>
        </div>
        <div class="footer">
            <p>This is an automated test email from Furniture Shop Management System</p>
        </div>
    </div>
</body>
</html>
    `;

        await sendEmail(testEmail, testSubject, testText, testHTML);
        logger.info(`Test email sent successfully to ${testEmail}`);
        return true;

    } catch (error) {
        logger.error(`Failed to send test email to ${testEmail}:`, error);

        return false;
    }
};

// Send sample invoice email (for testing templates)
export const sendSampleInvoice = async (testEmail: string): Promise<boolean> => {
    try {
        const sampleData = {
            invoiceNo: 'INV-2024-SAMPLE',
            customerName: 'John Doe',
            shopName: 'Sample Furniture Store',
            shopLocation: '123 Main Street, City, State',
            saleDate: new Date(),
            totalAmount: 1299.99,
            paymentMode: 'CASH',
            items: [
                {
                    name: 'Modern Sofa Set',
                    description: 'Comfortable 3-seater sofa with premium fabric',
                    category: 'Living Room',
                    quantity: 1,
                    unitPrice: 899.99,
                    total: 899.99
                },
                {
                    name: 'Coffee Table',
                    description: 'Wooden coffee table with storage',
                    category: 'Living Room',
                    quantity: 1,
                    unitPrice: 400.00,
                    total: 400.00
                }
            ]
        };

        const subtotal = sampleData.items.reduce((sum, item) => sum + item.total, 0);
        const discount = 0;

        const sampleHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sample Invoice ${sampleData.invoiceNo}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .email-container {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 300;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .sample-notice {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            text-align: center;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #2c3e50;
        }
        .invoice-details {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .invoice-details h3 {
            margin-top: 0;
            color: #2c3e50;
            font-size: 16px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
        }
        .detail-label {
            font-weight: 600;
            color: #555;
        }
        .detail-value {
            color: #333;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .items-table th {
            background-color: #667eea;
            color: white;
            padding: 15px 12px;
            text-align: left;
            font-weight: 600;
        }
        .items-table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
        .items-table tr:last-child td {
            border-bottom: none;
        }
        .items-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .text-right {
            text-align: right;
        }
        .total-section {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
        }
        .total-row.final {
            border-top: 2px solid #667eea;
            padding-top: 15px;
            margin-top: 15px;
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
        }
        .footer {
            background-color: #2c3e50;
            color: white;
            padding: 25px;
            text-align: center;
        }
        .thank-you {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 15px;
        }
        .contact-info {
            margin-top: 15px;
            font-size: 14px;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Invoice from ${sampleData.shopName}</h1>
            <p>Thank you for your purchase!</p>
        </div>
        
        <div class="content">
            <div class="sample-notice">
                <strong>📧 SAMPLE INVOICE EMAIL</strong><br>
                This is a sample invoice email to test your email template design.
            </div>
            
            <div class="greeting">
                Dear ${sampleData.customerName},
            </div>
            
            <p>Thank you for your recent purchase! Please find your invoice details below:</p>
            
            <div class="invoice-details">
                <h3>📋 Invoice Information</h3>
                <div class="detail-row">
                    <span class="detail-label">Invoice Number:</span>
                    <span class="detail-value">${sampleData.invoiceNo}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Invoice Date:</span>
                    <span class="detail-value">${sampleData.saleDate.toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Payment Method:</span>
                    <span class="detail-value">${sampleData.paymentMode}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Shop Location:</span>
                    <span class="detail-value">${sampleData.shopLocation}</span>
                </div>
            </div>

            <h3>🛍️ Items Purchased</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Category</th>
                        <th class="text-right">Qty</th>
                        <th class="text-right">Unit Price</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${sampleData.items.map(item => `
                        <tr>
                            <td>
                                <strong>${item.name}</strong>
                                <br><small style="color: #666;">${item.description}</small>
                            </td>
                            <td>${item.category}</td>
                            <td class="text-right">${item.quantity}</td>
                            <td class="text-right">₹${item.unitPrice.toFixed(2)}</td>
                            <td class="text-right">₹${item.total.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="total-section">
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>₹${subtotal.toFixed(2)}</span>
                </div>
                <div class="total-row final">
                    <span>Total Amount:</span>
                    <span>₹${sampleData.totalAmount.toFixed(2)}</span>
                </div>
            </div>

            <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
        </div>
        
        <div class="footer">
            <div class="thank-you">Thank you for choosing ${sampleData.shopName}!</div>
            <p>We appreciate your business and look forward to serving you again.</p>
            <div class="contact-info">
                <p>📍 ${sampleData.shopLocation}</p>
                <p>This is a sample email for testing purposes.</p>
            </div>
        </div>
    </div>
</body>
</html>`;

        const subject = `Sample Invoice ${sampleData.invoiceNo} - ${sampleData.shopName}`;
        const textContent = `
SAMPLE INVOICE FROM ${sampleData.shopName.toUpperCase()}

This is a sample invoice email to test your email template.

Dear ${sampleData.customerName},

Invoice Details:
- Invoice Number: ${sampleData.invoiceNo}
- Date: ${sampleData.saleDate.toLocaleDateString()}
- Total Amount: ₹${sampleData.totalAmount.toFixed(2)}

Items:
${sampleData.items.map(item => `- ${item.name} x ${item.quantity} @ ₹${item.unitPrice.toFixed(2)} = ₹${item.total.toFixed(2)}`).join('\n')}

This is a sample email for testing purposes.
`;

        await sendEmail(testEmail, subject, textContent, sampleHTML);
        logger.info(`Sample invoice email sent successfully to ${testEmail}`);
        return true;

    } catch (error) {
        logger.error(`Failed to send sample invoice email to ${testEmail}:`, error);
        return false;
    }
};

export default {
    testEmailConfiguration,
    sendSampleInvoice
};