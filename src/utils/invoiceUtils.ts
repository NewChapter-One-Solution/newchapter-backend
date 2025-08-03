import prisma from "../models/prisma-client";

// Generate unique invoice number
export const generateInvoiceNumber = async (): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  // Get the count of invoices created today
  const startOfDay = new Date(year, now.getMonth(), now.getDate());
  const endOfDay = new Date(year, now.getMonth(), now.getDate() + 1);

  const todayInvoiceCount = await prisma.sales.count({
    where: {
      saleDate: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  // Generate sequential number for the day
  const sequentialNumber = String(todayInvoiceCount + 1).padStart(4, '0');

  return `INV-${year}${month}${day}-${sequentialNumber}`;
};

// Validate invoice number format
export const validateInvoiceNumber = (invoiceNo: string): boolean => {
  const invoicePattern = /^INV-\d{8}-\d{4}$/;
  return invoicePattern.test(invoiceNo);
};

// Extract date from invoice number
export const extractDateFromInvoiceNumber = (invoiceNo: string): Date | null => {
  if (!validateInvoiceNumber(invoiceNo)) {
    return null;
  }

  const datePart = invoiceNo.split('-')[1];
  const year = parseInt(datePart.substring(0, 4));
  const month = parseInt(datePart.substring(4, 6)) - 1; // Month is 0-indexed
  const day = parseInt(datePart.substring(6, 8));

  return new Date(year, month, day);
};

// Calculate invoice totals
export interface InvoiceCalculation {
  subtotal: number;
  discountAmount: number;
  discountPercentage: number;
  totalAmount: number;
}

export const calculateInvoiceTotals = (
  items: Array<{ quantity: number; unitPrice: number }>,
  discountPercentage: number = 0
): InvoiceCalculation => {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discountAmount = (subtotal * discountPercentage) / 100;
  const totalAmount = subtotal - discountAmount;

  return {
    subtotal,
    discountAmount,
    discountPercentage,
    totalAmount,
  };
};

// Format currency for invoice display
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Generate invoice summary text
export const generateInvoiceSummary = (
  customerName: string,
  itemCount: number,
  totalAmount: number
): string => {
  return `Invoice for ${customerName} - ${itemCount} item${itemCount !== 1 ? 's' : ''} - ${formatCurrency(totalAmount)}`;
};

// Check if invoice number already exists
export const isInvoiceNumberUnique = async (invoiceNo: string): Promise<boolean> => {
  const existingInvoice = await prisma.sales.findUnique({
    where: { invoiceNo },
  });

  return !existingInvoice;
};

// Get next available invoice number if collision occurs
export const getNextAvailableInvoiceNumber = async (): Promise<string> => {
  let invoiceNo = await generateInvoiceNumber();
  let attempts = 0;
  const maxAttempts = 100;

  while (!(await isInvoiceNumberUnique(invoiceNo)) && attempts < maxAttempts) {
    // Add random suffix if collision occurs
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const randomSuffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');

    invoiceNo = `INV-${year}${month}${day}-${randomSuffix}`;
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('Unable to generate unique invoice number after maximum attempts');
  }

  return invoiceNo;
};