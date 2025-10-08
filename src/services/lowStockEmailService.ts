import { sendEmail } from '../config/nodemailer';
import prisma from '../models/prisma-client';
import CustomError from '../utils/CustomError';
import logger from '../utils/logger';
import { createEmailWrapper, createEmailHeader, createEmailFooter, formatCurrency } from '../utils/emailTemplates';

interface LowStockItem {
  id: string;
  productId: string;
  shopId: string;
  quantity: number;
  product: {
    name: string;
    price: string;
    category?: {
      name: string;
    };
  };
  shop: {
    name: string;
    location: string;
  };
  warehouse: {
    name: string;
  };
}

interface LowStockAlert {
  shopId: string;
  shopName: string;
  shopLocation: string;
  ownerId?: string;
  ownerEmail?: string;
  ownerName?: string;
  items: LowStockItem[];
  totalItems: number;
  criticalItems: number; // items with 0 stock
  lowItems: number; // items with 1-5 stock
}

export const lowStockEmailService = {
  // Get low stock items grouped by shop
  async getLowStockItemsByShop(threshold: number = 10): Promise<LowStockAlert[]> {
    try {
      const lowStockItems = await prisma.inventory.findMany({
        where: {
          quantity: {
            lte: threshold
          }
        },
        include: {
          product: {
            select: {
              name: true,
              price: true,
              category: {
                select: { name: true }
              }
            }
          },
          shop: {
            select: {
              name: true,
              location: true,
              ownerId: true
            }
          },
          warehouse: {
            select: { name: true }
          }
        },
        orderBy: [
          { quantity: 'asc' },
          { shop: { name: 'asc' } }
        ]
      });

      // Group items by shop
      const shopGroups = new Map<string, LowStockAlert>();

      for (const item of lowStockItems) {
        const shopId = item.shopId;

        if (!shopGroups.has(shopId)) {
          // Get shop owner details
          let ownerDetails = null;
          if (item.shop.ownerId) {
            ownerDetails = await prisma.user.findUnique({
              where: { id: item.shop.ownerId },
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            });
          }

          shopGroups.set(shopId, {
            shopId,
            shopName: item.shop.name,
            shopLocation: item.shop.location,
            ownerId: item.shop.ownerId || undefined,
            ownerEmail: ownerDetails?.email || undefined,
            ownerName: ownerDetails ? `${ownerDetails.firstName} ${ownerDetails.lastName || ''}`.trim() : undefined,
            items: [],
            totalItems: 0,
            criticalItems: 0,
            lowItems: 0
          });
        }

        const shopAlert = shopGroups.get(shopId)!;
        shopAlert.items.push(item as LowStockItem);
        shopAlert.totalItems++;

        if (item.quantity === 0) {
          shopAlert.criticalItems++;
        } else if (item.quantity <= 5) {
          shopAlert.lowItems++;
        }
      }

      return Array.from(shopGroups.values());
    } catch (error) {
      logger.error('Error getting low stock items by shop:', error);
      throw new CustomError('Failed to get low stock items', 500);
    }
  },

  // Send low stock alert to shop owner
  async sendLowStockAlert(shopAlert: LowStockAlert): Promise<boolean> {
    try {
      if (!shopAlert.ownerEmail) {
        logger.warn(`Shop owner for ${shopAlert.shopName} has no email address. Low stock alert not sent.`);
        return false;
      }

      const subject = `🚨 Low Stock Alert - ${shopAlert.shopName}`;
      const htmlContent = this.generateLowStockHTML(shopAlert);
      const textContent = this.generateLowStockText(shopAlert);

      await sendEmail(
        shopAlert.ownerEmail,
        subject,
        textContent,
        htmlContent
      );

      logger.info(`Low stock alert sent to ${shopAlert.ownerEmail} for shop ${shopAlert.shopName}`);
      return true;

    } catch (error) {
      logger.error(`Failed to send low stock alert for shop ${shopAlert.shopName}:`, error);
      return false;
    }
  },

  // Send low stock alerts to all affected shops
  async sendAllLowStockAlerts(threshold: number = 10): Promise<{
    totalShops: number;
    emailsSent: number;
    emailsFailed: number;
    shopsWithoutEmail: number;
  }> {
    try {
      const shopAlerts = await this.getLowStockItemsByShop(threshold);

      let emailsSent = 0;
      let emailsFailed = 0;
      let shopsWithoutEmail = 0;

      for (const shopAlert of shopAlerts) {
        if (!shopAlert.ownerEmail) {
          shopsWithoutEmail++;
          continue;
        }

        try {
          const sent = await this.sendLowStockAlert(shopAlert);
          if (sent) {
            emailsSent++;
          } else {
            emailsFailed++;
          }
        } catch (error) {
          emailsFailed++;
          logger.error(`Failed to send alert to shop ${shopAlert.shopName}:`, error);
        }
      }

      const summary = {
        totalShops: shopAlerts.length,
        emailsSent,
        emailsFailed,
        shopsWithoutEmail
      };

      logger.info(`Low stock alert summary:`, summary);
      return summary;

    } catch (error) {
      logger.error('Error sending low stock alerts:', error);
      throw error;
    }
  },

  // Generate HTML email content
  generateLowStockHTML(shopAlert: LowStockAlert): string {
    const header = createEmailHeader(
      `🚨 Low Stock Alert`,
      `${shopAlert.shopName} - Immediate Action Required`
    );

    const urgencyLevel = shopAlert.criticalItems > 0 ? 'CRITICAL' : 'WARNING';
    const urgencyColor = shopAlert.criticalItems > 0 ? '#e74c3c' : '#f39c12';

    const content = `
      <div class="email-content">
        <div class="greeting">
          Dear ${shopAlert.ownerName || 'Shop Owner'},
        </div>
        
        <div class="alert-box alert-${shopAlert.criticalItems > 0 ? 'warning' : 'info'}">
          <strong>${urgencyLevel} ALERT:</strong> Your shop has ${shopAlert.totalItems} item(s) with low stock levels that require immediate attention.
        </div>

        <div class="info-box">
          <h3>📊 Stock Alert Summary</h3>
          <div class="detail-row">
            <span class="detail-label">Shop Name:</span>
            <span class="detail-value">${shopAlert.shopName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Location:</span>
            <span class="detail-value">${shopAlert.shopLocation}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Total Low Stock Items:</span>
            <span class="detail-value">${shopAlert.totalItems}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Out of Stock (Critical):</span>
            <span class="detail-value" style="color: #e74c3c; font-weight: bold;">${shopAlert.criticalItems}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Low Stock (1-5 items):</span>
            <span class="detail-value" style="color: #f39c12; font-weight: bold;">${shopAlert.lowItems}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Alert Date:</span>
            <span class="detail-value">${new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <h3>📦 Items Requiring Attention</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Status</th>
              <th>Warehouse</th>
            </tr>
          </thead>
          <tbody>
            ${shopAlert.items.map(item => {
      let statusColor = '#27ae60';
      let statusText = 'Low Stock';

      if (item.quantity === 0) {
        statusColor = '#e74c3c';
        statusText = 'OUT OF STOCK';
      } else if (item.quantity <= 2) {
        statusColor = '#e74c3c';
        statusText = 'Critical';
      } else if (item.quantity <= 5) {
        statusColor = '#f39c12';
        statusText = 'Low';
      }

      return `
                <tr>
                  <td>
                    <strong>${item.product.name}</strong>
                    <br><small style="color: #666;">Price: ${formatCurrency(parseFloat(item.product.price))}</small>
                  </td>
                  <td>${item.product.category?.name || 'N/A'}</td>
                  <td style="text-align: center; font-weight: bold; font-size: 16px;">
                    ${item.quantity}
                  </td>
                  <td style="color: ${statusColor}; font-weight: bold; text-align: center;">
                    ${statusText}
                  </td>
                  <td>${item.warehouse.name}</td>
                </tr>
              `;
    }).join('')}
          </tbody>
        </table>

        <div class="alert-box alert-info">
          <h4>📋 Recommended Actions:</h4>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${shopAlert.criticalItems > 0 ? '<li><strong>URGENT:</strong> Restock out-of-stock items immediately to avoid lost sales</li>' : ''}
            <li>Review and update minimum stock levels for these products</li>
            <li>Contact suppliers to place new orders</li>
            <li>Consider setting up automatic reorder points</li>
            <li>Monitor sales trends to optimize inventory levels</li>
          </ul>
        </div>

        <p>Please take immediate action to restock these items to ensure smooth business operations and customer satisfaction.</p>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="#" class="button" style="background-color: ${urgencyColor};">
            📊 View Full Inventory Report
          </a>
        </div>
      </div>
    `;

    const footer = createEmailFooter(
      shopAlert.shopName,
      shopAlert.shopLocation,
      'This is an automated low stock alert. Please check your inventory management system for real-time updates.'
    );

    return createEmailWrapper(header + content + footer);
  },

  // Generate plain text email content
  generateLowStockText(shopAlert: LowStockAlert): string {
    const urgencyLevel = shopAlert.criticalItems > 0 ? 'CRITICAL' : 'WARNING';

    let textContent = `
LOW STOCK ALERT - ${urgencyLevel}

Dear ${shopAlert.ownerName || 'Shop Owner'},

${urgencyLevel} ALERT: Your shop has ${shopAlert.totalItems} item(s) with low stock levels that require immediate attention.

SHOP DETAILS:
- Shop Name: ${shopAlert.shopName}
- Location: ${shopAlert.shopLocation}
- Alert Date: ${new Date().toLocaleDateString()}

STOCK SUMMARY:
- Total Low Stock Items: ${shopAlert.totalItems}
- Out of Stock (Critical): ${shopAlert.criticalItems}
- Low Stock (1-5 items): ${shopAlert.lowItems}

ITEMS REQUIRING ATTENTION:
`;

    shopAlert.items.forEach(item => {
      let status = 'Low Stock';
      if (item.quantity === 0) {
        status = 'OUT OF STOCK';
      } else if (item.quantity <= 2) {
        status = 'Critical';
      } else if (item.quantity <= 5) {
        status = 'Low';
      }

      textContent += `
- ${item.product.name}
  Category: ${item.product.category?.name || 'N/A'}
  Current Stock: ${item.quantity}
  Status: ${status}
  Warehouse: ${item.warehouse.name}
  Price: ${formatCurrency(parseFloat(item.product.price))}
`;
    });

    textContent += `
RECOMMENDED ACTIONS:
${shopAlert.criticalItems > 0 ? '- URGENT: Restock out-of-stock items immediately to avoid lost sales\n' : ''}
- Review and update minimum stock levels for these products
- Contact suppliers to place new orders
- Consider setting up automatic reorder points
- Monitor sales trends to optimize inventory levels

Please take immediate action to restock these items to ensure smooth business operations and customer satisfaction.

${shopAlert.shopName}
${shopAlert.shopLocation}

This is an automated low stock alert. Please check your inventory management system for real-time updates.
`;

    return textContent;
  },

  // Send test low stock alert
  async sendTestLowStockAlert(testEmail: string, shopId?: string): Promise<boolean> {
    try {
      // Create sample data for testing
      const sampleAlert: LowStockAlert = {
        shopId: shopId || 'sample-shop-id',
        shopName: 'Sample Furniture Store',
        shopLocation: '123 Main Street, City, State',
        ownerId: 'sample-owner-id',
        ownerEmail: testEmail,
        ownerName: 'John Doe',
        items: [
          {
            id: 'sample-1',
            productId: 'product-1',
            shopId: shopId || 'sample-shop-id',
            quantity: 0,
            product: {
              name: 'Modern Sofa Set',
              price: '899.99',
              category: { name: 'Living Room' }
            },
            shop: {
              name: 'Sample Furniture Store',
              location: '123 Main Street, City, State'
            },
            warehouse: { name: 'Main Warehouse' }
          },
          {
            id: 'sample-2',
            productId: 'product-2',
            shopId: shopId || 'sample-shop-id',
            quantity: 2,
            product: {
              name: 'Coffee Table',
              price: '299.99',
              category: { name: 'Living Room' }
            },
            shop: {
              name: 'Sample Furniture Store',
              location: '123 Main Street, City, State'
            },
            warehouse: { name: 'Main Warehouse' }
          },
          {
            id: 'sample-3',
            productId: 'product-3',
            shopId: shopId || 'sample-shop-id',
            quantity: 4,
            product: {
              name: 'Dining Chair',
              price: '149.99',
              category: { name: 'Dining Room' }
            },
            shop: {
              name: 'Sample Furniture Store',
              location: '123 Main Street, City, State'
            },
            warehouse: { name: 'Secondary Warehouse' }
          }
        ],
        totalItems: 3,
        criticalItems: 1,
        lowItems: 2
      };

      const sent = await this.sendLowStockAlert(sampleAlert);

      if (sent) {
        logger.info(`Test low stock alert sent successfully to ${testEmail}`);
      }

      return sent;

    } catch (error) {
      logger.error(`Failed to send test low stock alert to ${testEmail}:`, error);
      return false;
    }
  }
};

export default lowStockEmailService;