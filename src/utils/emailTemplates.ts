// Email template utilities for consistent styling across all emails

export const emailStyles = `
<style>
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    margin: 0;
    padding: 0;
    background-color: #f4f4f4;
  }
  .email-wrapper {
    max-width: 800px;
    margin: 0 auto;
    background-color: #ffffff;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  .email-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    text-align: center;
  }
  .email-header h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 300;
  }
  .email-header p {
    margin: 10px 0 0 0;
    opacity: 0.9;
    font-size: 16px;
  }
  .email-content {
    padding: 30px;
  }
  .greeting {
    font-size: 18px;
    margin-bottom: 20px;
    color: #2c3e50;
  }
  .info-box {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
    border-left: 4px solid #667eea;
  }
  .info-box h3 {
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
  .email-footer {
    background-color: #2c3e50;
    color: white;
    padding: 25px;
    text-align: center;
  }
  .email-footer p {
    margin: 5px 0;
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
  .button {
    display: inline-block;
    background-color: #667eea;
    color: white;
    padding: 12px 25px;
    text-decoration: none;
    border-radius: 5px;
    margin: 15px 0;
    font-weight: 600;
  }
  .alert-box {
    padding: 15px;
    border-radius: 5px;
    margin: 15px 0;
  }
  .alert-success {
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
  }
  .alert-warning {
    background-color: #fff3cd;
    border: 1px solid #ffeaa7;
    color: #856404;
  }
  .alert-info {
    background-color: #d1ecf1;
    border: 1px solid #bee5eb;
    color: #0c5460;
  }
  @media (max-width: 600px) {
    .email-content { padding: 20px; }
    .detail-row { flex-direction: column; }
    .items-table { font-size: 14px; }
    .items-table th, .items-table td { padding: 8px; }
  }
</style>
`;

export const createEmailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice Email</title>
    ${emailStyles}
</head>
<body>
    <div class="email-wrapper">
        ${content}
    </div>
</body>
</html>
`;

export const createEmailHeader = (title: string, subtitle?: string) => `
<div class="email-header">
    <h1>${title}</h1>
    ${subtitle ? `<p>${subtitle}</p>` : ''}
</div>
`;

export const createEmailFooter = (shopName: string, shopLocation: string, additionalInfo?: string) => `
<div class="email-footer">
    <div class="thank-you">Thank you for choosing ${shopName}!</div>
    <p>We appreciate your business and look forward to serving you again.</p>
    <div class="contact-info">
        <p>📍 ${shopLocation}</p>
        ${additionalInfo ? `<p>${additionalInfo}</p>` : ''}
        <p>This is an automated email. Please do not reply to this message.</p>
    </div>
</div>
`;

export const formatCurrency = (amount: number, currency: string = '₹'): string => {
  return `${currency}${amount.toFixed(2)}`;
};

export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const createInfoBox = (title: string, details: Array<{ label: string, value: string }>) => `
<div class="info-box">
    <h3>${title}</h3>
    ${details.map(detail => `
        <div class="detail-row">
            <span class="detail-label">${detail.label}:</span>
            <span class="detail-value">${detail.value}</span>
        </div>
    `).join('')}
</div>
`;

export const createItemsTable = (items: Array<{
  name: string;
  description?: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}>) => `
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
        ${items.map(item => `
            <tr>
                <td>
                    <strong>${item.name}</strong>
                    ${item.description ? `<br><small style="color: #666;">${item.description}</small>` : ''}
                </td>
                <td>${item.category || 'N/A'}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                <td class="text-right">${formatCurrency(item.total)}</td>
            </tr>
        `).join('')}
    </tbody>
</table>
`;

export const createTotalSection = (totals: Array<{ label: string, value: number, isFinal?: boolean }>) => `
<div class="total-section">
    ${totals.map(total => `
        <div class="total-row ${total.isFinal ? 'final' : ''}">
            <span>${total.label}:</span>
            <span>${formatCurrency(total.value)}</span>
        </div>
    `).join('')}
</div>
`;

export const createAlertBox = (message: string, type: 'success' | 'warning' | 'info' = 'info') => `
<div class="alert-box alert-${type}">
    ${message}
</div>
`;

export default {
  emailStyles,
  createEmailWrapper,
  createEmailHeader,
  createEmailFooter,
  createInfoBox,
  createItemsTable,
  createTotalSection,
  createAlertBox,
  formatCurrency,
  formatDate
};