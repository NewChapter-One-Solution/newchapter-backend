import cron from 'node-cron';
import { lowStockEmailService } from '../services/lowStockEmailService';
import logger from '../utils/logger';
import prisma from '../models/prisma-client';

// Configuration for low stock thresholds
const LOW_STOCK_CONFIG = {
  DEFAULT_THRESHOLD: 10,
  CRITICAL_THRESHOLD: 5,
  OUT_OF_STOCK_THRESHOLD: 0,
  CRON_SCHEDULE: '0 22 * * *', // Run at 10 PM every day
  ENABLED: process.env.LOW_STOCK_ALERTS_ENABLED !== 'false'
};

// Track last alert dates to avoid spam
const lastAlertDates = new Map<string, Date>();

export const lowStockCronJob = {
  // Main cron job function
  start() {
    if (!LOW_STOCK_CONFIG.ENABLED) {
      logger.info('Low stock alerts are disabled');
      return;
    }

    logger.info(`Starting low stock cron job with schedule: ${LOW_STOCK_CONFIG.CRON_SCHEDULE}`);

    // Schedule the cron job to run at 10 PM every day
    cron.schedule(LOW_STOCK_CONFIG.CRON_SCHEDULE, async () => {
      logger.info('Starting nightly low stock check...');

      try {
        await this.performLowStockCheck();
      } catch (error) {
        logger.error('Error in low stock cron job:', error);
      }
    }, {
      scheduled: true,
      timezone: process.env.TIMEZONE || 'Asia/Kolkata'
    });

    logger.info('Low stock cron job scheduled successfully');
  },

  // Perform the actual low stock check
  async performLowStockCheck() {
    try {
      const startTime = Date.now();
      logger.info('Performing low stock check...');

      // Get system-wide low stock statistics
      const stats = await this.getLowStockStatistics();

      if (stats.totalLowStockItems === 0) {
        logger.info('No low stock items found. All inventory levels are healthy.');
        return;
      }

      logger.info(`Found ${stats.totalLowStockItems} low stock items across ${stats.shopsAffected} shops`);

      // Send alerts to shop owners
      const alertResults = await lowStockEmailService.sendAllLowStockAlerts(LOW_STOCK_CONFIG.DEFAULT_THRESHOLD);

      // Log the results
      const duration = Date.now() - startTime;
      logger.info(`Low stock check completed in ${duration}ms:`, {
        ...alertResults,
        ...stats,
        duration: `${duration}ms`
      });

      // Send summary to administrators if there are critical issues
      if (stats.criticalItems > 0) {
        await this.sendAdminSummary(stats, alertResults);
      }

      // Update last check timestamp
      await this.updateLastCheckTimestamp();

    } catch (error) {
      logger.error('Error performing low stock check:', error);
      throw error;
    }
  },

  // Get comprehensive low stock statistics
  async getLowStockStatistics() {
    try {
      const [
        totalLowStockItems,
        criticalItems,
        outOfStockItems,
        shopsAffected,
        categoriesAffected
      ] = await Promise.all([
        // Total low stock items
        prisma.inventory.count({
          where: {
            quantity: { lte: LOW_STOCK_CONFIG.DEFAULT_THRESHOLD }
          }
        }),

        // Critical items (very low stock)
        prisma.inventory.count({
          where: {
            quantity: {
              lte: LOW_STOCK_CONFIG.CRITICAL_THRESHOLD,
              gt: LOW_STOCK_CONFIG.OUT_OF_STOCK_THRESHOLD
            }
          }
        }),

        // Out of stock items
        prisma.inventory.count({
          where: {
            quantity: LOW_STOCK_CONFIG.OUT_OF_STOCK_THRESHOLD
          }
        }),

        // Number of shops affected
        prisma.inventory.groupBy({
          by: ['shopId'],
          where: {
            quantity: { lte: LOW_STOCK_CONFIG.DEFAULT_THRESHOLD }
          }
        }).then(groups => groups.length),

        // Number of categories affected
        prisma.inventory.findMany({
          where: {
            quantity: { lte: LOW_STOCK_CONFIG.DEFAULT_THRESHOLD }
          },
          include: {
            product: {
              select: {
                categoryId: true
              }
            }
          }
        }).then(items => {
          const categories = new Set(items.map(item => item.product.categoryId));
          return categories.size;
        })
      ]);

      return {
        totalLowStockItems,
        criticalItems,
        outOfStockItems,
        shopsAffected,
        categoriesAffected,
        threshold: LOW_STOCK_CONFIG.DEFAULT_THRESHOLD,
        checkDate: new Date()
      };

    } catch (error) {
      logger.error('Error getting low stock statistics:', error);
      throw error;
    }
  },

  // Send summary email to administrators
  async sendAdminSummary(stats: any, alertResults: any) {
    try {
      // Get admin users
      const admins = await prisma.user.findMany({
        where: {
          role: 'ADMIN',
          isActive: true
        },
        select: {
          email: true,
          firstName: true,
          lastName: true
        }
      });

      if (admins.length === 0) {
        logger.warn('No admin users found with email addresses for summary notification');
        return;
      }

      const subject = `📊 Daily Low Stock Summary - ${stats.criticalItems} Critical Items`;

      const htmlContent = this.generateAdminSummaryHTML(stats, alertResults);
      const textContent = this.generateAdminSummaryText(stats, alertResults);

      // Send to all admins
      for (const admin of admins) {
        if (admin.email) {
          try {
            const { sendEmail } = await import('../config/nodemailer');
            await sendEmail(admin.email, subject, textContent, htmlContent);
            logger.info(`Admin summary sent to ${admin.email}`);
          } catch (error) {
            logger.error(`Failed to send admin summary to ${admin.email}:`, error);
          }
        }
      }

    } catch (error) {
      logger.error('Error sending admin summary:', error);
    }
  },

  // Generate HTML content for admin summary
  generateAdminSummaryHTML(stats: any, alertResults: any): string {
    const { createEmailWrapper, createEmailHeader, createEmailFooter } = require('../utils/emailTemplates');

    const urgencyColor = stats.outOfStockItems > 0 ? '#e74c3c' : '#f39c12';

    const header = createEmailHeader(
      '📊 Daily Low Stock Summary',
      'System-wide Inventory Alert Report'
    );

    const content = `
      <div class="email-content">
        <div class="greeting">
          Dear Administrator,
        </div>
        
        <p>Here's your daily low stock summary for all shops in the system:</p>

        <div class="info-box">
          <h3>📈 System Statistics</h3>
          <div class="detail-row">
            <span class="detail-label">Total Low Stock Items:</span>
            <span class="detail-value">${stats.totalLowStockItems}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Out of Stock Items:</span>
            <span class="detail-value" style="color: #e74c3c; font-weight: bold;">${stats.outOfStockItems}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Critical Items (≤5):</span>
            <span class="detail-value" style="color: #f39c12; font-weight: bold;">${stats.criticalItems}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Shops Affected:</span>
            <span class="detail-value">${stats.shopsAffected}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Categories Affected:</span>
            <span class="detail-value">${stats.categoriesAffected}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Check Date:</span>
            <span class="detail-value">${stats.checkDate.toLocaleString()}</span>
          </div>
        </div>

        <div class="info-box">
          <h3>📧 Email Alert Summary</h3>
          <div class="detail-row">
            <span class="detail-label">Total Shops with Low Stock:</span>
            <span class="detail-value">${alertResults.totalShops}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Emails Sent Successfully:</span>
            <span class="detail-value" style="color: #27ae60; font-weight: bold;">${alertResults.emailsSent}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email Failures:</span>
            <span class="detail-value" style="color: #e74c3c; font-weight: bold;">${alertResults.emailsFailed}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Shops Without Email:</span>
            <span class="detail-value" style="color: #f39c12; font-weight: bold;">${alertResults.shopsWithoutEmail}</span>
          </div>
        </div>

        ${stats.outOfStockItems > 0 ? `
          <div class="alert-box alert-warning">
            <strong>⚠️ URGENT ACTION REQUIRED:</strong> There are ${stats.outOfStockItems} products completely out of stock. 
            These items may be causing lost sales and should be restocked immediately.
          </div>
        ` : ''}

        <div class="alert-box alert-info">
          <h4>📋 Recommended Admin Actions:</h4>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Review shops with email failures and update contact information</li>
            <li>Follow up with shop owners who haven't responded to alerts</li>
            <li>Consider adjusting stock thresholds for frequently low-stock items</li>
            <li>Analyze trends to identify seasonal or recurring stock issues</li>
            <li>Ensure all shop owners have valid email addresses for alerts</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 20px 0;">
          <a href="#" class="button" style="background-color: ${urgencyColor};">
            📊 View Detailed Inventory Report
          </a>
        </div>
      </div>
    `;

    const footer = createEmailFooter(
      'Furniture Shop Management System',
      'System Administration',
      'This is an automated daily summary. Low stock alerts are sent to individual shop owners automatically.'
    );

    return createEmailWrapper(header + content + footer);
  },

  // Generate text content for admin summary
  generateAdminSummaryText(stats: any, alertResults: any): string {
    return `
DAILY LOW STOCK SUMMARY

Dear Administrator,

Here's your daily low stock summary for all shops in the system:

SYSTEM STATISTICS:
- Total Low Stock Items: ${stats.totalLowStockItems}
- Out of Stock Items: ${stats.outOfStockItems}
- Critical Items (≤5): ${stats.criticalItems}
- Shops Affected: ${stats.shopsAffected}
- Categories Affected: ${stats.categoriesAffected}
- Check Date: ${stats.checkDate.toLocaleString()}

EMAIL ALERT SUMMARY:
- Total Shops with Low Stock: ${alertResults.totalShops}
- Emails Sent Successfully: ${alertResults.emailsSent}
- Email Failures: ${alertResults.emailsFailed}
- Shops Without Email: ${alertResults.shopsWithoutEmail}

${stats.outOfStockItems > 0 ? `
URGENT ACTION REQUIRED: There are ${stats.outOfStockItems} products completely out of stock. 
These items may be causing lost sales and should be restocked immediately.
` : ''}

RECOMMENDED ADMIN ACTIONS:
- Review shops with email failures and update contact information
- Follow up with shop owners who haven't responded to alerts
- Consider adjusting stock thresholds for frequently low-stock items
- Analyze trends to identify seasonal or recurring stock issues
- Ensure all shop owners have valid email addresses for alerts

Furniture Shop Management System
System Administration

This is an automated daily summary. Low stock alerts are sent to individual shop owners automatically.
`;
  },

  // Update last check timestamp in database or cache
  async updateLastCheckTimestamp() {
    try {
      // You could store this in a settings table or use a simple file/cache
      // For now, we'll just log it
      logger.info(`Low stock check completed at ${new Date().toISOString()}`);
    } catch (error) {
      logger.error('Error updating last check timestamp:', error);
    }
  },

  // Manual trigger for testing
  async triggerManualCheck() {
    logger.info('Manual low stock check triggered');
    return await this.performLowStockCheck();
  },

  // Stop the cron job
  stop() {
    logger.info('Low stock cron job stopped');
  }
};

// Start the cron job when this module is imported
if (LOW_STOCK_CONFIG.ENABLED) {
  lowStockCronJob.start();
}

export default lowStockCronJob;